"""Find horizontal reading bands without changing the source image.

Single compression pixels can join adjacent rows. Split only unusually tall
bands, so thin strokes inside a normal-height character remain intact.
"""
import cv2
import numpy as np


def ink_bands(mask, threshold=1):
    bands = []
    for yy in np.where((mask > 0).sum(axis=1) >= threshold)[0]:
        yy = int(yy)
        if not bands or yy - bands[-1][-1] > 1:
            bands.append([yy])
        else:
            bands[-1].append(yy)
    return [(b[0], b[-1] + 1) for b in bands if len(b) >= 3]


def reading_bands(inner, ignore_regions=()):
    if min(inner.shape[:2]) < 3:
        return []
    gray = cv2.cvtColor(inner, cv2.COLOR_BGR2GRAY)
    mask = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV | cv2.THRESH_OTSU)[1]
    if (mask > 0).mean() > .5:
        mask = 255 - mask
    def remove_graphics(target):
        for region in ignore_regions:
            x, y, width, height = (region[key] for key in ('x', 'y', 'width', 'height'))
            target[max(0, y - 2):min(target.shape[0], y + height + 2),
                   max(0, x - 2):min(target.shape[1], x + width + 2)] = 0
    remove_graphics(mask)
    bands = ink_bands(mask)
    median = np.median([last - first for first, last in bands]) if bands else 0
    refined = []
    for first, last in bands:
        if len(bands) >= 3 and last - first >= median * 1.65:
            pieces = ink_bands(mask[first:last], 2)
            if len(pieces) > 1:
                refined.extend((a + first, b + first) for a, b in pieces)
                continue
        refined.append((first, last))
    # An outlined word block can merge into one foreground blob on a colored
    # background. Use its dark strokes only when they yield multiple bands.
    # White-only text has no dark strokes, so it keeps the original result.
    hsv = cv2.cvtColor(inner, cv2.COLOR_BGR2HSV)
    if (hsv[:, :, 1] > 80).mean() > .3 and any(b - a > inner.shape[0] * .45 for a, b in refined):
        black = np.uint8(inner.max(axis=2) < 80) * 255
        remove_graphics(black)
        alternate = ink_bands(black, 2)
        if .005 < (black > 0).mean() < .3 and len(alternate) >= 2:
            refined = alternate
        else:
            # Sharpening can darken a colored outline/background enough to join
            # every row at the ordinary threshold. Look for distinct darker
            # strokes only after that method fails. Keep the original pixels
            # for recognition, and retain the existing result if no separated
            # rows can be established.
            candidates = []
            for cutoff in (60, 40):
                darker = np.uint8(inner.max(axis=2) < cutoff) * 255
                remove_graphics(darker)
                pieces = ink_bands(darker, 2)
                if (.005 < (darker > 0).mean() < .3 and len(pieces) >= 2
                        and max(b-a for a, b in pieces) <= inner.shape[0] * .45):
                    candidates.append(pieces)
            if candidates:
                refined = max(candidates, key=len)
    return refined


def reading_regions(inner, ignore_regions=()):
    """Keep a smaller, isolated bottom-left corner label separate from body ink.

    Both pieces are returned; this does not discard digits or infer numbering.
    Same-size text and close characters keep the ordinary full-width band.
    """
    height, width = inner.shape[:2]
    bands = reading_bands(inner, ignore_regions)
    regions = []
    for first, last in bands:
        split = None
        if first > height * .70 and last > height * .88 and width >= 40:
            strip = inner[first:last]
            # Corner indices on the target printed boards have dark strokes.
            # White text and dark backgrounds keep the original segmentation.
            ink = strip.max(axis=2) < 100
            if .005 < ink.mean() < .35:
                columns = np.flatnonzero(ink.any(axis=0))
                gaps = np.diff(columns)
                candidates = np.flatnonzero(gaps >= max(12, (last-first) * .65))
                for pos in candidates:
                    left, right = int(columns[pos]), int(columns[pos+1])
                    if columns[0] > width * .12 or left > width * .28:
                        continue
                    label_rows = np.flatnonzero(ink[:, :left+1].any(axis=1))
                    body_rows = np.flatnonzero(ink[:, right:].any(axis=1))
                    if not len(label_rows) or not len(body_rows):
                        continue
                    label_height = label_rows[-1]-label_rows[0]+1
                    body_height = body_rows[-1]-body_rows[0]+1
                    if label_height <= body_height * .85 and label_height >= 5:
                        split = (left+right)//2
                        break
        if split is None:
            regions.append((0, first, width, last-first))
        else:
            regions.extend([(0, first, split, last-first),
                            (split, first, width-split, last-first)])
    return regions
