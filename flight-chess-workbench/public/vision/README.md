OpenCV runtime: @techstark/opencv-js 5.0.0-release.1
GitHub: https://github.com/TechStark/opencv-js
npm tarball shasum: 9fa00e762cd045dff5231b743b80207bb99af371
opencv.js copied unchanged from npm dist/opencv.js. Apache-2.0 license in OpenCV-LICENSE.

cell-detector.js adapts the line morphology/contour approach from:
https://github.com/eihli/image-table-ocr/blob/master/table_ocr/extract_cells/__init__.py
MIT license: image-table-ocr-LICENSE. Original copyright Eric Ihli (2020).
Local additions: multiple thresholds, rectangular contour checks, relative kernel/cell sizes, duplicate suppression, dominant-area filtering and worker integration.
This adaptation does not include Tesseract, text OCR, or the Python command-line application.
Runtime and inputs stay on the same origin. No CDN and no image uploads.

Edge branch uses the Canny/contour strategy from https://github.com/tony-xlh/opencvjs-document-scanner (MIT, Copyright (c) 2024 Tony), adapted to collect cell-sized contours rather than one document border. No perspective correction or OCR is implied.
