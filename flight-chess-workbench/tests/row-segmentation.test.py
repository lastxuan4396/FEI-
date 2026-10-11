import sys, unittest
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
import cv2
import numpy as np
from row_segmentation import ink_bands, reading_bands, reading_regions

class BandTests(unittest.TestCase):
    def test_single_pixel_bridge_splits_only_tall_band(self):
        image=np.full((90,80,3),255,np.uint8)
        for a,b in [(3,13),(17,27),(40,50),(52,62)]: image[a:b,6:36]=0
        image[50:52,10]=0
        self.assertEqual(reading_bands(image),[(3,13),(17,27),(40,50),(52,62)])

    def test_thin_character_stroke_in_normal_band_is_not_split(self):
        image=np.full((70,80,3),255,np.uint8)
        for a in [3,20,40]: image[a:a+10,6:36]=0
        image[25,:,:]=255;image[25,10]=0
        self.assertEqual(reading_bands(image),[(3,13),(20,30),(40,50)])

    def test_outline_on_colored_background_uses_dark_strokes(self):
        image=np.full((70,80,3),(30,30,230),np.uint8)
        image[2:56,3:46]=255
        for a in [8,24,40]: image[a:a+10,6:36]=0
        self.assertEqual(reading_bands(image),[(8,18),(24,34),(40,50)])

    def test_white_only_text_on_color_does_not_disappear(self):
        image=np.full((70,80,3),(30,30,230),np.uint8)
        for a in [8,24,40]: image[a:a+10,6:36]=255
        self.assertEqual(reading_bands(image),[(8,18),(24,34),(40,50)])

    def test_darkened_outline_does_not_join_readable_rows(self):
        image=np.full((70,80,3),(30,180,30),np.uint8)
        image[2:56,3:46]=70
        for a in [8,24,40]: image[a:a+10,6:36]=20
        before=image.copy()
        self.assertEqual(reading_bands(image),[(8,18),(24,34),(40,50)])
        self.assertTrue(np.array_equal(image,before))

    def test_dark_backdrop_without_separated_strokes_keeps_original_band(self):
        image=np.full((70,80,3),(30,180,30),np.uint8)
        image[2:56,3:46]=70
        bands=reading_bands(image)
        self.assertEqual(len(bands),1)
        self.assertGreater(bands[0][1]-bands[0][0],45)

    def test_blank_and_tiny_are_empty(self):
        self.assertEqual(reading_bands(np.full((70,80,3),255,np.uint8)),[])
        self.assertEqual(reading_bands(np.full((2,2,3),255,np.uint8)),[])
        self.assertEqual(ink_bands(np.zeros((70,80),np.uint8)),[])

    def test_smaller_corner_label_and_body_are_both_preserved(self):
        image=np.full((110,164,3),255,np.uint8)
        image[89:107,2:7]=0
        image[89:107,15:20]=0
        for x in range(60,145,15): image[80:106,x:x+5]=0
        regions=reading_regions(image)
        self.assertEqual(len(regions),2)
        coverage=np.zeros(image.shape[:2],np.uint8)
        for x,y,w,h in regions: coverage[y:y+h,x:x+w]=1
        self.assertTrue(np.all(coverage[(image==0).all(axis=2)]==1))
        self.assertLess(regions[0][2],60)

    def test_body_numbers_and_same_size_words_do_not_split(self):
        image=np.full((110,164,3),255,np.uint8)
        image[80:106,2:24]=0
        image[80:106,60:145]=0
        self.assertEqual(len(reading_regions(image)),1)
        image[89:107,2:24]=0
        image[80:106,30:145]=0
        self.assertEqual(len(reading_regions(image)),1)

if __name__=='__main__': unittest.main()
