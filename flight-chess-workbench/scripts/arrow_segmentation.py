"""Conservative detection of isolated, filled, axis-aligned direction arrows.

Only a seven-corner silhouette matching a triangular head and narrower shaft
qualifies. Inline symbols, outline arrows and ambiguous shapes remain OCR text.
No source pixels are changed, and direction is still an unreviewed candidate.
"""
import cv2
import numpy as np


def _match_arrow(mask):
    best = (0., None)
    for direction, turns in [('up', 0), ('left', 3), ('down', 2), ('right', 1)]:
        upright = np.rot90(mask, turns)
        height, width = upright.shape
        if not 1.35 < height / width < 3.8:
            continue
        observed = cv2.resize(upright, (48, 80), interpolation=cv2.INTER_NEAREST) > 0
        for neck in range(26, 42, 2):
            for half in range(9, 15):
                points = np.array([[23, 0], [47, neck], [23 + half, neck],
                                   [23 + half, 79], [23 - half, 79],
                                   [23 - half, neck], [0, neck]], np.int32)
                template = np.zeros((80, 48), np.uint8)
                cv2.fillPoly(template, [points], 255)
                template = template > 0
                score = float((observed & template).sum() / (observed | template).sum())
                if score > best[0]:
                    best = (score, direction)
    return best


def isolated_arrows(inner):
    if min(inner.shape[:2]) < 12:
        return []
    mask = np.uint8(inner.max(axis=2) < 115) * 255
    count, labels, stats, _ = cv2.connectedComponentsWithStats(mask)
    arrows = []
    for index in range(1, count):
        x, y, width, height, area = (int(v) for v in stats[index])
        if area < 100 or min(width, height) < 12:
            continue
        component = np.uint8(labels[y:y + height, x:x + width] == index) * 255
        contours, _ = cv2.findContours(component, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        if len(contours) != 1:
            continue
        contour = contours[0]
        polygon = cv2.approxPolyDP(contour, .035 * cv2.arcLength(contour, True), True)
        if len(polygon) != 7:
            continue
        score, direction = _match_arrow(component)
        if score < .86:
            continue
        # Other dark ink on the same row would make removal ambiguous. Read it
        # normally instead of trying to discard a character inside a sentence.
        neighbors = mask[max(0, y - 2):min(mask.shape[0], y + height + 2)].copy()
        neighbors[:, max(0, x - 2):min(mask.shape[1], x + width + 2)] = 0
        if np.count_nonzero(neighbors) > 4:
            continue
        arrows.append({'x': x, 'y': y, 'width': width, 'height': height,
                       'direction': direction, 'score': round(score, 4)})
    return arrows
