import json
import scipy
import numpy as np
import menpo.io as mio

from pathlib import Path
from menpo.image import Image
from menpo.shape import PointCloud

import deepmachine as dm
from deepmachine import contrib
from deepmachine import utils

model_path = 'D:/pretrained_models/model.ckpt-574050'
dense_pose_net = contrib.get_dense_pose_net_old()
dense_pose_net.restore_path = model_path


def fit(image_path, bbox_list):
    image = mio.import_image(image_path)
    bbox = PointCloud(np.array(bbox_list).reshape(-1, 2)
                      [:, ::-1]).bounding_box()

    cimg, trans, *_ = utils.crop_image_bounding_box(image, bbox, [256, 256], base=256)
    lms_hm_prediction, states = dense_pose_net.run_one(
        cimg.pixels_with_channels_at_back().astype(np.float32)[None, ...]
    )

    bsize, h, w, n_ch = lms_hm_prediction.shape
    lms_hm_prediction_filter = np.stack(list(map(
        lambda x: scipy.ndimage.filters.gaussian_filter(*x),
        zip(lms_hm_prediction.transpose(0, 3, 1, 2).reshape(-1, h, w), [5] * (bsize * n_ch)))))

    hs = np.argmax(np.max(lms_hm_prediction_filter.squeeze(), 2), 1)
    ws = np.argmax(np.max(lms_hm_prediction_filter.squeeze(), 1), 1)
    pts_predictions = np.stack([hs, ws]).T

    return trans.apply(pts_predictions).tolist()
