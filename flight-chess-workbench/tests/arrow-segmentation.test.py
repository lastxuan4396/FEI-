import sys, unittest
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
import cv2
import numpy as np
from arrow_segmentation import isolated_arrows
from row_segmentation import reading_bands


def arrow_canvas(direction='up'):
    shape=np.zeros((65,37),np.uint8)
    points=np.array([[18,0],[36,25],[26,25],[26,64],[10,64],[10,25],[0,25]],np.int32)
    cv2.fillPoly(shape,[points],255)
    shape=np.rot90(shape,{'up':0,'left':1,'down':2,'right':3}[direction])
    image=np.full((110,110,3),(110,155,230),np.uint8)
    h,w=shape.shape;image[25:25+h,25:25+w][shape>0]=35
    return image


class ArrowTests(unittest.TestCase):
    def test_four_directions_and_no_source_pixel_changes(self):
        for direction in ['up','left','down','right']:
            image=arrow_canvas(direction);before=image.copy();result=isolated_arrows(image)
            self.assertEqual([a['direction'] for a in result],[direction])
            self.assertGreaterEqual(result[0]['score'],.86)
            self.assertTrue(np.array_equal(image,before))

    def test_arrow_is_separate_from_text_rows(self):
        image=arrow_canvas('down');image[4:13,10:18]=0;image[4:13,24:32]=0
        arrows=isolated_arrows(image);self.assertEqual(len(arrows),1)
        self.assertEqual(reading_bands(image,arrows),[(4,13)])
        self.assertGreater(len(reading_bands(image)),1)

    def test_real_digits_letters_and_open_chinese_strokes_stay_text(self):
        for text in ['1','4','I','T','Y','A','7']:
            image=np.full((110,110,3),255,np.uint8)
            cv2.putText(image,text,(18,85),cv2.FONT_HERSHEY_SIMPLEX,2.4,(0,0,0),5)
            self.assertEqual(isolated_arrows(image),[],text)
            self.assertTrue(reading_bands(image),text)
        image=np.full((110,110,3),255,np.uint8)
        cv2.polylines(image,[np.array([[18,60],[53,18],[88,60]],np.int32)],False,(0,0,0),5)
        cv2.line(image,(53,30),(53,95),(0,0,0),5)
        self.assertEqual(isolated_arrows(image),[])

    def test_inline_arrow_outline_and_small_shapes_are_not_removed(self):
        image=arrow_canvas('up');cv2.putText(image,'4',(68,80),cv2.FONT_HERSHEY_SIMPLEX,1,(0,0,0),3)
        self.assertEqual(isolated_arrows(image),[])
        outline=np.full((110,110,3),255,np.uint8)
        cv2.polylines(outline,[np.array([[55,10],[85,45],[68,45],[68,95],[42,95],[42,45],[25,45]],np.int32)],True,(0,0,0),2)
        self.assertEqual(isolated_arrows(outline),[])
        self.assertEqual(isolated_arrows(np.full((2,2,3),255,np.uint8)),[])
        self.assertEqual(isolated_arrows(np.full((110,110,3),255,np.uint8)),[])

if __name__=='__main__': unittest.main()
