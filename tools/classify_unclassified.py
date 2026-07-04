#!/usr/bin/env python3
"""Consolidated batch classifier for unclassified taxonomy terms.

Combines four graduated strategies into one maintainable pipeline:

  1. v1 — Pattern-list matching (known architecture, dataset, tool, math names)
  2. v2 — Suffix/prefix regex patterns (-Net, -Former, Ada*, etc.)
  3. v3 — Explicit term mapping (~600 entries)
  4. v4 — Final cleanup for edge-case terms

Usage:
  # Preview what would be classified (dry-run)
  python3 tools/classify_unclassified.py --terms-index /tmp/build/terms/index.json

  # Preview and save proposals to a file (no registry mutation)
  python3 tools/classify_unclassified.py --terms-index /tmp/build/terms/index.json \\
      --out /tmp/proposals.json

  # Classify into registry
  python3 tools/classify_unclassified.py --terms-index /tmp/build/terms/index.json \\
      --registry data/taxonomy-registry.json --merge

  # Full pipeline: classify, merge, and rebuild
  python3 tools/classify_unclassified.py --terms-index /tmp/build/terms/index.json \\
      --registry data/taxonomy-registry.json --merge --rebuild
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from collections import Counter
from pathlib import Path
from typing import Any

sys.path.insert(0, "tools")
from build_published_content import normalize_key, semantic_tokens


# ═══════════════════════════════════════════════════════════════════════════════
# Strategy 1: Pattern-list matching (originally tools/classify_remaining.py)
# ═══════════════════════════════════════════════════════════════════════════════

V1_ARCH_KEYWORDS = [
    "repvgg", "regnet", "mobilenet", "mobilenext", "mobilevit", "mnasnet",
    "shufflenet", "squeezenet", "efficientnet", "efficientvit", "efficientdet",
    "resnet", "resnext", "densenet", "vovnet", "har", "dnet",
    "sparsenet", "spnasnet", "sposnet", "fbnet", "condensenet", "peleenet",
    "ghostnet", "mixnet", "tinynas", "tresnet", "pyramidnet",
    "darknet", "cspdarknet", "cspresnet", "cspresnext",
    "edgenet", "edgenext", "espnet", "espnetv", "icnet", "ocnet",
    "pidnet", "upernet", "ocrnet", "hrnet", "litehrnet",
    "linknet", "resunet", "transunet", "unet",
    "pafpn", "bifpn", "fpn",
    "centernet", "fcos", "vfnet", "detr", "yolact", "solov2",
    "refinedet", "tridentnet", "foveabox",
    "convnext", "convformer", "convmixer", "resmlp", "gmlp",
    "poolformer", "crossvit", "deit", "cait", "volo",
    "swin", "swin transformer",
    "timesformer", "x3d", "c3d", "i3d",
    "pointnet", "pointconv", "pointmlp", "pointtransformer",
    "posenet", "openpose", "blazepose", "denspose",
    "stylegan", "cyclegan", "stargan", "pix2pix",
    "vae", "diffusion", "lstm", "gru", "rnn", "transformer",
    "bert", "roberta", "electra", "albert", "distilbert",
    "gpt", "llama", "mistral", "qwen", "gemma",
    "alexnet", "vgg", "googlenet", "inception", "xception",
    "zfnet", "nin", "lenet",
]

V1_DATASET_NAMES = [
    "imagenet", "cifar", "mnist", "svhn", "coco", "pascal voc",
    "kitti", "cityscapes", "bdd100k", "nuscenes", "argoverse",
    "waymo", "lyft level5",
    "kinetics", "ucf101", "hmdb51", "something-something",
    "audioset", "librispeech", "timit", "voxceleb",
    "wikitext", "bookcorpus", "cc3m", "cc12m", "laion",
    "squad", "triviaqa", "hotpotqa", "natural questions",
    "glue", "superglue", "xnli", "xtreme",
    "mimic", "chexpert", "nih chest", "padchest", "vinbigdata",
    "luad", "camelyon", "tcga",
    "deepglobe", "eurosat", "sen12ms",
    "amazon reviews", "yelp", "imdb",
    "gigaword", "cnn dailymail", "xsum", "wikihow",
    "wmt", "iwlst", "paracrawl", "tatoeba",
    "blended skill talk", "dailydialog", "multiwoz",
]

V1_TOOL_NAMES = [
    "opencv", "opennmt", "opendevin", "openvpi", "openvoice", "opencog",
    "spacy", "flax", "haiku", "trax", "mxnet", "pytorch", "tensorflow",
    "jax", "keras", "caffe", "cntk", "theano", "onnx", "tvm",
    "tensorrt", "openvino", "coreml", "tflite",
    "torchaudio", "torchtext", "torchvision", "torchrec", "torchbeast",
    "transformers", "datasets", "accelerate", "diffusers", "peft",
    "mlflow", "kubeflow", "polyaxon", "valohai", "determined",
    "dagster", "prefect", "flyte", "zenml", "pachyderm", "guild",
    "mlserver", "kfserving", "bentoml", "predibase", "anyscale",
    "fairseq", "sockeye", "marian", "tensor2tensor",
    "deepspeech", "kaldi", "speechbrain", "whisper",
    "albumentations", "imgaug", "kornia",
    "scipy", "numpy", "pandas", "scikit", "sklearn", "matplotlib",
    "plotly", "seaborn", "bokeh", "statsmodels",
    "polars", "vaex", "pyspark", "dask", "ray",
    "xgboost", "lightgbm", "catboost", "gradientboosting",
    "llama.cpp", "ggml", "exllama", "ktransformers",
    "vllm", "tgi", "text-generation-inference",
    "spark", "flink", "kafka", "airflow", "nifi",
    "docker", "kubernetes", "terraform", "helm",
    "gitlab", "jenkins", "circleci", "github actions",
    "wandb", "neptune", "comet", "sacred",
    "dvc", "lakefs", "pachyderm",
    "sympy", "cvxpy", "pulp", "ortools",
]

V1_VENDOR_NAMES = [
    "graphcore", "groq", "tenstorrent", "sambanova", "cerebras",
    "hailo", "untether", "edgecortix", "kneron",
    "anyscale", "baseten", "modal", "replicate",
    "snorkel", "superb", "scale", "labelbox", "appen",
    "assemblyai", "speechmatics", "sonox", "rev",
    "deepgram", "elevenlabs", "resemble", "descript",
    "cohere", "ai21", "anthropic", "openai",
    "langsmith", "helicone", "why labs", "arize",
    "truera", "giskard", "hiddenlayer",
    "octoai", "together", "fireworks", "perplexity",
    "airbyte", "fivetran", "stitch", "meltano",
    "superblocks", "retool", "bubble",
    "nvidia", "amd", "qualcomm",
    "google cloud", "aws", "azure", "ibm",
    "databricks", "snowflake", "redshift",
]

V1_MATH_CONCEPTS = [
    "eigenvalue", "eigenvector", "eigendecomposition", "diagonalization",
    "eigenface", "singular value", "svd",
    "kullback", "leibler", "kl divergence",
    "kolmogorov", "smirnov",
    "covariance", "correlation", "autocorrelation",
    "homoscedastic", "heteroscedastic",
    "goodness of fit", "goodness-of-fit",
    "mle", "maximum likelihood", "map estimation",
    "bayesian", "prior", "posterior", "conjugate",
    "markov chain", "monte carlo", "mcmc",
    "bootstrap", "resampling", "jackknife",
    "hypothesis", "p-value", "confidence interval",
    "anova", "manova", "t-test", "chi-squared",
    "dimensionality", "pca", "tsne", "umap",
    "kernel", "gaussian process",
    "information criterion", "aic", "bic",
    "regularization", "lasso", "ridge", "elastic net",
    "entropy", "mutual information",
    "gradient", "adam", "sgd",
    "loss function", "cost function", "objective",
    "normalization", "standardization", "scaling",
    "convolution", "pooling", "downsampling", "upsampling",
    "interpolation", "bilinear", "bicubic",
    "logistic", "softmax", "sigmoid", "relu",
    "clustering", "k-means", "dbscan", "hierarchical",
    "classification", "regression", "ranking",
]


# ═══════════════════════════════════════════════════════════════════════════════
# Strategy 2: Suffix/prefix regex patterns (originally classify_remaining_v2.py)
# ═══════════════════════════════════════════════════════════════════════════════

V2_ARCH_SUFFIX = re.compile(
    r"(?i)(?:"
    r"Transformer"
    r"|Transformer-base|Transformer-Large"
    r"|-Former\b|-Former-\w+|^-Former"
    r"|-ViT\b|-ViT-\w+"
    r"|-GAN\b|-GAN-\w+|^GAN"
    r"|-VAE\b|-VAE-|^VAE"
    r"|-RNN\b|-LSTM\b"
    r"|-CNN\b|-DNN\b"
    r"|-BERT\b|-GPT\b|^GPT-"
    r"|-LLaMA\b|-Mistral\b|-Gemma\b"
    r"|-Diffusion\b"
    r"|-NeRF\b|-NeRF-"
    r"|-SORT\b|-DeepSORT\b"
    r")\b"
)

V2_DATASET_ACRONYM = re.compile(r"(?i)^[A-Z]{2,}(?:[-_][A-Z0-9]+)*(?:-\d{2,})$")
V2_DATASET_SUFFIX = re.compile(r"(?i)(?:Set|Dataset|Corpus|Benchmark)\s*$")

V2_TOOL_SUFFIX = re.compile(r"(?i)(?:py|lib|kit|tool|sdk)$")

V2_TOOL_NAMES = {
    "pytorch", "tensorflow", "jax", "keras", "caffe", "mxnet",
    "pytorch3d", "pyg", "dgl", "paddlepaddle", "flax", "haiku", "trax",
    "onnx", "tvm", "mlflow", "kubeflow", "wandb", "neptune", "comet",
    "tensorrt", "openvino", "coreml", "tflite",
    "transformers", "diffusers", "datasets", "accelerate", "peft",
    "langchain", "langsmith", "llama.cpp", "vllm", "tgi",
    "whisper", "spacy", "nltk", "stanza",
    "opencv", "albumentations", "imgaug", "kornia",
    "detectron2", "mmdetection", "mmcv", "mmpose", "mmsegmentation",
    "mmocr", "mmediting", "mmrotate", "mmhuman3d",
    "pytorch-lightning", "lightning",
    "huggingface", "hugging face", "gradio",
    "ray", "dask", "pyspark", "polars", "vaex",
    "xgboost", "lightgbm", "catboost",
    "numpy", "scipy", "pandas", "scikit-learn", "sklearn",
    "matplotlib", "seaborn", "plotly", "bokeh",
    "statsmodels", "prophet", "sktime", "gluonts",
    "networkx", "igraph", "stellargraph",
    "redis", "postgres", "mongodb", "neo4j",
    "qdrant", "pinecone", "chroma", "weaviate", "milvus",
    "airflow", "prefect", "dagster", "flyte", "zenml",
    "docker", "kubernetes",
    "jupyter", "jupyterlab",
    "pydantic", "fastapi", "flask", "django",
    "pytest", "unittest", "mypy", "pylint",
    "deepchecks", "whylabs", "whylogs",
    "flash", "flashattention",
    "xformers", "flashinfer",
    "ollama", "openrouter", "replicate",
    "streamlit", "nicegui",
    "torchaudio", "torchtext", "torchvision", "torchrec",
}


# ═══════════════════════════════════════════════════════════════════════════════
# Strategy 3: Explicit term mapping (originally classify_remaining_v3.py + v4.py)
# ═══════════════════════════════════════════════════════════════════════════════

def _build_term_map() -> dict[str, tuple[str, str]]:
    """Build the comprehensive explicit term-to-category mapping."""
    m = {}

    # Model architectures → Neural Networks / Core Models
    nn_archs = {
        "adaconvnet", "adaface", "adafom", "adagan", "airnet",
        "amoebanet", "amoebanet-d", "anynet", "ar-nlms", "astgcn",
        "astgcn-adaptive", "attfusenet", "autoformer", "autoformer-deep",
        "autoint", "basenji2", "batchformer", "bipnet", "bitnet",
        "bitnet b1.58", "branchformer", "caformer", "cgnet",
        "cgnet-3x3", "chebnet", "condinst", "condinst-r50",
        "convtasnet", "cosformer", "crossnorm", "ctformer", "cutblur",
        "danet", "darnet", "dcn-v2", "ddrnet", "ddrnet-23",
        "deepar", "deepar-plus", "deepcluster", "deepctr",
        "deepface", "deepfm", "deepid", "deepiv", "deeplabcut",
        "deeplabv2", "deepnet", "deeponet", "deeponets", "deepprivacy2",
        "deepsea", "deepseek v3", "deepstate", "densepose",
        "dg-stgcn", "dg-stgcn-xl", "dien", "din", "din-v2",
        "dinov2", "discogan", "distilwhisper", "dmtet",
        "doccoder", "docformer", "dragonnet", "dreambooth",
        "dreamgaussian", "drophead", "dropkey", "dropneuron",
        "droppath", "dsin", "dssm", "dualgan", "dvgo v2",
        "dyhead-retinanet", "edgeconv", "edgevit-xl", "edsr",
        "efficientformer-l3", "eg3d", "emonet", "equibind",
        "esmfold", "espcn", "etsformer", "facefusion", "facenet",
        "fairface", "fastvit", "fastvit-xs",        "flen",
        "fractalnet", "fsrcnn", "fuyu-8b", "ganimation", "ganspace",
        "gatedgcn", "gatedgraphconv", "gato", "gautoencoder",
        "gfl-couplet", "glam", "glam-1.2t", "glam-64e",
        "gradinit", "granite 3.3", "graphaf", "graphformer-xl",
        "graphgps", "graphormer", "graphwavenet", "graphwavenet-2",
        "graspnet", "hd-vila-100m", "hexplane", "hrformer",
        "hugectr", "hyperadapter-xl", "hyperadapters", "hyperattention",
        "hyperbatchnorm", "hyperlora", "hypermixer", "hyperneat",
        "idefics", "incoder-6b", "infersent", "infogail",
        "informer", "informer-xl", "instant-ngp", "instruct2act",
        "instructblip", "internlm", "internvideo-2b", "internvl",
        "isnet", "isnet-edgeseg", "jais", "judgelm",
        "jukebox", "jukebox model", "kandinsky", "kandinsky-2.2",
        "kpconv", "kpconv-rigid", "ladernet", "layerskip",
        "layoutlm-v1", "layoutlm-v2", "layoutlm-v3", "layoutlmv3",
        "layoutxlm", "lightcnn", "lightfm", "lightgcn", "lightrank",
        "litevit-s", "longrope", "longrope2",
        "maddpg", "magface", "marianmt", "mariannmt",
        "maxvit", "megadepth", "mergequant", "minicpm",
        "minilm", "minilm-l12", "minilm-l12-384", "minilm-l6",
        "minilm-l6-384", "minkowskinet", "mirasol3b",
        "mixformer-b", "mixhop", "mixmatch", "mixstyle",
        "mobilenerf", "mobileone", "mobileone-s0", "mobileone-s1",
        "mobileone-s2", "mobileone-s3", "mobilesam",
        "mockingjay", "mocov2", "mocov3", "monet",
        "mt0", "mt5", "mtcnn", "mvit-v2-b", "mvit-v2-huge",
        "mvit-v2-s", "n-beats", "n-beats-generic", "n-hits",
        "n-hits-xl", "nanocaller", "neftune", "nematus",
        "nerfstudio", "netgan", "netmf", "neuralangelo",
        "neuralcausality", "neuralprophet", "neus", "neus-2",
        "nextvlad", "novelai", "nystromformer", "nyströmformer",
        "nyströmformer-base", "nyströmformer-plus", "odin",
        "openelm", "openface", "openfold", "opt",
        "paconv", "paformer", "panopticgan", "patchup",
        "pfgm-++", "photomaper", "pidformer",
        "pix2struct", "plenoctrees", "plenoxels", "pointcnn",
        "pointnext-xl", "pointpillars", "pointrend", "polycoder-2.7b",
        "polyloss", "polynet", "pondernet", "pp-yoloe-plus",
        "ppgn", "prefixlm", "promptcascade-xl",
        "proteinmpnn", "protopnet", "psinet", "puzzlemix",
        "pyraformer", "pyraformer-deep", "pythia (eleuther)",
        "pytorch3d", "qmix", "qrazor", "qtran",
        "reactnet", "realnvp", "relora", "replknet",
        "replknet-31", "replknet-xl", "reppan", "reppoints",
        "reppoints-v2", "res2net", "rescal", "resgated graphconv",
        "retinaface", "retinanet", "rformer", "ricap",
        "riffusion", "rl2", "rmsnorm", "robocat", "rosettafold",
        "rsconv", "saint", "scalenorm", "sd-repaint",
        "segnerf", "sepformer", "sgld", "siamcar", "siamrpn++",
        "simcse", "simmim", "simsiam", "slipper",
        "smoothgrad", "softplus", "softsign", "solo",
        "sparseconvnet", "sparsemoe-256e", "sparseneus",
        "spconvnet", "specgan", "sphereface", "spherenet",
        "sprint", "srcnn", "sru-v2", "stackgan", "stackgan++",
        "stardist", "stgnn-plus", "structext", "structlayoutlm",
        "stylemix", "stylenerf", "styletts2",
        "sublayerdrop", "superprompt", "switchnorm",
        "t0", "tacotron", "tacotron2", "tadw", "tagconv",
        "tensorf", "tera", "timegan", "timesfm",
        "tinyvideonet", "tinyvideonet-xl", "tokenmix",
        "transd", "transnormer", "transpose",
        "treenet", "trellisnet", "uctransnet", "unilm-v1",
        "unilm-v2", "unilm-v3", "univnet",
        "vad-siammask", "vail", "vdn", "videolm", "videomae",
        "videopoet", "vnet", "waveglow",
        "xdeepfm", "xgen-7b", "xnmt",
        "yolov2", "yolov6", "yolox",
        "zephyr 7b", "zeroquant-v2", "zeror", "zeroscope-xl",
        "zigzagnet", "zipformer", "zloss",
        "adapterdrop", "adapterdrop deep", "adaptnlp",
        "alphadropout", "alphageometry", "alphapose", "alphatensor",
        "compacter", "compacter-plus",
        "dynamicsparsemoe-xl",
        "bigvgan", "audiolm",
    }

    for name in nn_archs:
        m[name] = ("Neural Networks", "Core Models")

    # Optimizers → Optimization Algorithms
    optimizers = {
        "a2grad", "acprop", "adac1", "adac2", "adacost",
        "adahessian", "adaprop", "adascale", "adasecant",
        "adashift", "adasmooth", "adasum", "addsign",
        "diffgrad", "diffgrad / adahessian", "lion",
        "madgrad", "novograd", "powersign",
        "ranger", "ranger / ranger21 / rangerqh", "ranger21", "rangerqh",
        "sm3 / adasum / adascale", "smors3",
        "adam", "adamw", "adamax", "adabelief", "adabound",
        "quickprop", "q-prop",
        "reducelronplateau", "sawtooth lr",
    }
    for name in optimizers:
        m[name] = ("Optimization Algorithms", "Gradient-Based Optimizers")

    # Datasets → Data Processing
    datasets = {
        "ade20k", "affectnet", "apolloscape",
        "bigpatent", "billsum", "bioasq",
        "camvid", "ccgbank", "chestx-ray14",
        "clevrer", "cmrc2018", "commonsenseqa", "convfinqa", "coqa",
        "dolly 15k", "dolma", "dolphin18k", "drcf", "dureader",
        "feverous", "finqa", "flyingchairs", "flyingthings3d",
        "germanquad", "govreport", "gsm8k",
        "house3d", "howto100m", "human3.6m", "humaneval", "hypersim",
        "jft-300m", "korquad",
        "luna16", "mathqa", "mathvista",
        "matterport3d", "medmcqa", "mednli", "medqa",
        "mlqa", "multiarith", "multiatis++", "multinews",
        "narrativeqa", "newsroom",
        "oasis brain mri", "openbookqa", "openwebtext",
        "physionet", "piqa", "places365", "pubmedqa",
        "ravdess", "redcaps", "rucola",
        "samsun", "scannet", "sberquad", "scienceqa",
        "siqa", "socialiqa", "strategyqa", "svamp", "svamp-mc", "swag",
        "tabfact", "ted talks summaries", "textvqa", "tydiqa",
        "vindr-cxr", "vizwiz",
        "webchild", "webvid-10m", "wikihop", "wikimatrix", "winogrande",
        "xcoa", "xqa", "xquad",
        "youcookii", "yottixel",
        # New datasets from v4
        "aqua-rat", "csqa 2.0", "gaze360", "human connectome project (hcp)",
        "indicqa", "infographicvqa", "longsumm", "mathbench",
        "omnibench", "quac", "scibench", "redpajama",
        "slimorca", "slimpajama", "deeplesion", "biobench",
        "bioimage.io models", "mlagentbench",
    }
    for name in datasets:
        m[name] = ("Data Processing", "Data Pipeline")

    # Tools → ML Frameworks
    tools = {
        "allennlp", "ampligraph", "annoy",
        "apache hudi", "apache iceberg", "apache jena", "apache pulsar ml",
        "arangodb", "augly", "autodistill", "autokeras",
        "automatic1111", "autoprompt", "autoraq",
        "blazegraph", "blendensemble", "brax",
        "causalml", "causalnex", "chatdev",
        "cirq", "cleanrl", "clickhouse ml", "cml (ci for ml)",
        "cnvrg.io", "codeium", "colmap", "comfyui",
        "conceptnet", "coppeliasim", "cornac",
        "cortex (cortexlabs)", "crypgen",
        "datafold", "dataproc for ml",
        "deepchecks", "deepcrispr", "deeplift",
        "deepmatch", "deepmoe", "deeppavlov", "deepprobllg", "deepshap",
        "deeptrio", "deepvariant", "defuzzification",
        "detectron2", "dexnet", "expbt",
        "diffai", "diffaugment", "diffdock", "diffiora", "diffsinger",
        "directlingam", "dirtycat",
        "docarray", "dowhy",
        "econml", "evalchemy",
        "fairboost", "fairgbm", "fairscale", "falkon",
        "fasterwhisper", "fedml",
        "flax", "flashinfer",
        "foocus", "geopandas", "geotrch",
        "gluon", "gluonts", "graphdb (ontotext)",
        "graphite", "griddly",
        "heygen", "hnswlib",
        "hyperopt", "ilastik",
        "iree", "julius", "jupyter notebook", "jupyter notebooks",
        "koboldcpp", "lancedb",
        "litellm", "lmdeploy", "lmql", "ludwig",
        "make.com", "make.com (integromat)", "memgraph",
        "merlin (nvtabular)", "merlion", "meshlab", "meshroom",
        "microtvm", "mindstudio", "mindstudio ai",
        "mmaction2", "mmcv", "mmdetection", "mmdetection3d",
        "mmediting", "mmhuman3d", "mmecr", "mmpose", "mmrotate",
        "mmsegmentation", "mnn (alibaba)", "moveit",
        "mp-spdz", "ncnn (tencent)", "nevergrad",
        "nixtla statsforecast", "nmslib", "nodepiece",
        "nomic embed", "oobabooga", "open3d",
        "openclip", "opencyc", "openie", "openmined pysyft",
        "openmvg", "openmvs", "openneero", "openorca",
        "openrooms", "openrouter", "openspiel",
        "orbit (uber)", "paddlepaddle",        "palisade he", "pandasgui", "pennylane",
        "petastorm", "pdfplumber", "pillow",
        "polyglotqa", "prodigy", "progol",
        "promptfoo", "promptfoo ci", "prompthub", "promptlayer",
        "promptsource", "prophet", "pyannote.audio diarization",
        "pyarrow", "pybullet", "pydanticai", "pygaze", "pykeen",
        "pymupdf", "pyvacy", "qwak",
        "rago", "recbole", "rise", "roboagentbench",
        "robosuite", "ros", "ros 2", "satpy",
        "scanpy", "scanvi", "scgen", "scvi",
        "segments.ai", "sense2vec", "seurat",
        "shapely", "sigopt", "simplecv", "sktime",
        "snowpark ml", "soniox", "sourcegraph cody",
        "spektral", "spikingjelly", "spinnaker", "spleeter",
        "stardog", "stellargraph", "superannotate",
        "supersuit", "supervisely", "tabulapy",
        "tfhe", "tfrecord (gzip/seqio)", "thinc",
        "tianshou", "tinyml", "tpot", "torchsat",
        "trimesh", "tsfresh", "typechat",
        "unify.ai", "utensor",
        "vald", "vosk",
        "webllm", "webots", "whylabs", "whylabs langkit", "whylogs",
        "xformers", "xarray", "zipline",
        # Additional from v4
        "altair", "aqlm", "arduino ml", "autodev", "autopen",
        "bun + ai", "cellbender", "cellpose", "clam (wsi mil)",
        "cursor ide", "cublas", "fiona",
        "ggplot (python port)", "grafana lgtm for ml", "grafana ml dashboards",
        "histoqc", "katteb", "kbinsdiscretizer",
        "knora-e", "knora-u", "maniskill", "napari", "nav2",
        "n8n", "n8n ai",
        "pq + opq + ivf-flat", "rasterio", "rioxarray", "rtree",
        "smac3", "struc2vec", "sveltekit ai",
        "table extraction (camelot)", "toloka crowdsourcing",
        "vwo fullstack", "windsurf ide", "zephyr rtos + tflm",
        "transmogrifai", "tensorrec",
        "vamana ann (diskann)", "uplifttree",
        # Missing v4 manual-fix terms
        "causalnet", "cougaar",
        "diarization with vbx", "framenet", "gbrank",
        "mixture of retrievers (mor)", "moverscore",
        "multigraph", "mure", "project gutenberg",
        "quate", "retrosynthesis models", "sensefusion",
        "simrank",
    }
    for name in tools:
        m[name] = ("Machine Learning Frameworks", "Automated Processes")

    # Model optimization → Model Optimization (overrides NN/MF for attention kernels)
    model_opt = {
        "flashattention", "flashattention-2", "flashattention-3",
        "pagedattention", "pagedattention-2",
    }
    for name in model_opt:
        m[name] = ("Model Optimization", "Model Compression")

    # AI ecosystem / platforms → AI Applications
    for term in [
        "ai blogs", "ai books", "ai bootcamps", "ai certifications",
        "ai clusters", "ai communities", "ai companions", "ai conferences",
        "ai data centers", "ai degrees (bachelor, master, phd)",
        "ai journals", "ai magazines", "ai meetups", "ai moocs",
        "ai myths and misconceptions", "ai podcasts", "ai regulations",
        "ai seminars", "ai summer schools", "ai supercomputers",
        "ai tutorials", "ai wearables", "ai webinars", "ai workshops",
    ]:
        m[term] = ("AI Applications", "")

    ai_platforms = {
        "3dfy", "abacus ai", "akkio", "anyword", "avoma",
        "bigeye data", "bigeye ml data",
        "calypsoai", "chorus ai", "clarifai", "colossyan",
        "copy.ai", "copysmith", "craiyon",
        "d-id ai", "daily.co ai", "deci ai",
        "deepdub", "deepmotion ai",
        "dialpad ai", "eden ai",
        "elai.io", "fireflies.ai", "fritz ai",
        "gong ai", "grammarly ai",
        "hive ai", "humanloop",
        "kaiber ai", "krea ai", "krisp ai",
        "leonardo ai", "levity ai", "lovo.ai",
        "meshcapade ai", "midjourney",
        "move.ai", "observe.ai",
        "octoml", "otter.ai", "papercup",
        "pipedream ai", "plask ai", "playht 2.0",
        "podcast.ai", "podcastle", "polycam ai",
        "quillbot ai", "radical ai",
        "rephrase.ai", "replika", "replit ghostwriter",
        "riverside ai", "runway ai", "runway gen-2", "rytr",
        "shortlyai", "sonantic", "sonix.ai",
        "sudowrite", "suno ai", "synthesia",
        "taskmatrix.ai", "trint ai",
        "udio", "unify.ai", "veritone aiware",
        "wordtune", "writesonic", "zed ai",
        # Additional platforms from v4
        "beeagent", "bud-e", "bureaucratic models",
        "cranium ai", "eco-ai", "etched ssm accelerator",
        "expertise elicitation", "itracker", "otter",
    }
    for name in ai_platforms:
        m[name] = ("AI Applications", "")

    # Statistical concepts
    stats = {
        "benjamini-hochberg procedure", "bump hunting",
        "c4.5", "c5.0", "cohen's kappa", "cohen's kappa",
        "combinatorics", "configuration model", "contrasts",
        "elitism", "elitism in ga",
        "fowlkes-mallows index",
        "granger causality",
        "homophily", "homophily & heterophily modeling",
        "indian buffet process", "ising model",
        "kantorovich-rubinstein duality",
        "limitations of ai",
        "log-concave distributions", "log-concave distributions in ml",
        "modularity", "moore-penrose pseudoinverse",
        "ooda loop", "ooda loop (observe-orient-decide-act)",
        "ooda loop (observe-orient-decide-act) in ai",
        "orthogonalization",
        "page-hinkley test", "pathwise derivatives",
        "pitman-yor process", "pontryagin's maximum principle",
        "potts model", "prequential validation",
        "problog",
        "random ferns", "random k-labelsets (rakel)", "random lowercasing",
        "random seed in ml", "rule of thumb",
        "schelling's model",
        "seed fixing", "seed fixing & deterministic ops",
        "somers' d", "sphering",
        "theil-sen estimator",
        "tukey's fences",
        "watts-strogatz model", "winsorization",
        # From v4
        "arbiter models", "chung-lu model", "combo",
        "quadrature methods", "resubstitution validation",
        "shapley-taylor for interactions", "pairre",
    }
    for name in stats:
        m[name] = ("Statistical Methods", "Bayesian Inference")

    # Ethics / governance
    ethics = {
        "ccpa for ai", "gdpr for ai", "hipaa for ai",
        "iso/iec 23894 ai risk", "iso/iec 42001 ai management",
        "oecd ai principles",
        "ai accountability", "ai governance", "ai bias",
        "factuality probes",
        "frontier model reporting", "frontier models",
        "pickle deserialization risks",
        "right-to-forget mechanics",
        "sr 11-7 for ml",
        "vulnerability disclosure for models",
        "precedent cases",
        "provenance chains (c2pa)",
        "sufficiency/comprehensiveness tests",
        "front-door adjustment ml",
    }
    for name in ethics:
        m[name] = ("Ethics & Governance", "")

    # NLP terms
    nlp = {
        "algebranlp", "indicnlp", "romanization",
        "selfies strings", "tinycog",
        "wikification", "wiki-coref (wikification)",
        "criticlm", "interrap", "mtop", "quest",
        "xwinograd",
    }
    for name in nlp:
        m[name] = ("Natural Language Processing", "")

    # Generative models
    gen = {
        "animatediff", "deepdream",
        "deepfloyd if", "deepfloyd-if-xl",
        "gen-1 runway", "gen-3 alpha (runway)",
        "movigen", "tabgan",
    }
    for name in gen:
        m[name] = ("Generative Models", "Diffusion Models")

    # Model evaluation
    eval = {
        "model diagnostics", "model discrimination", "model dissection",
        "model fit", "model patching", "model provenance",
        "model validation", "overfitted model",
    }
    for name in eval:
        m[name] = ("Model Evaluation", "Performance Metrics")

    # Data preprocessing
    data_prep = {
        "data echoing", "data freshness", "data residency for ai",
        "data valuation", "databoost-im",
        "differencing",
        "centering", "undersampling",
        "shuffleacrosschunks", "shufflewithinchunks",
        "unaries collapsing / expansion",
        "swapnoise", "switchout",
    }
    for name in data_prep:
        m[name] = ("Data Preprocessing", "Data Scaling")

    # RL terms
    rl = {
        "agent57", "agenthub", "agentmesh",
        "bcq", "cql", "iql",
        "dreamerv2",
        "maddpg",
        "minerl", "minedojo",
        "pommerman",
        "scenario.gg",
        "supersuit",
        "rlbench", "legged locomotion",
    }
    for name in rl:
        m[name] = ("Reinforcement Learning", "Advanced RL Techniques")

    # Security
    security = {
        "adversarialqa", "certifiable rule models", "neurify",
        "nli-as-guardrail", "odin",
        "reface sanitizer", "verinet", "vnn-comp",
        "promptshadowing-adaptive", "xrai",
    }
    for name in security:
        m[name] = ("Security & Robustness", "Adversarial Machine Learning")

    # Hardware
    hardware = {
        "cpus for ai", "fpgas for ai", "tpus for ai",
        "gcp tpu v5e", "gpudirect rdma", "infiniband gpudirect",
        "host staging buffers", "trapped ion qubits",
        "ucx (gpu rdma)", "async dataloader prefetch",
        "tensorfloat-32", "infiniband",
    }
    for name in hardware:
        m[name] = ("AI Applications", "")

    # Learning paradigms
    learning = {
        "biological neurons as inspiration",
        "connectome-based ai", "connectomics ai",
        "grokking",
        "manager-planner-worker stacks",
        "open-endedness playgrounds",
        "overparameterization",
        "rectifier",
    }
    for name in learning:
        m[name] = ("Learning Paradigms", "")

    return m


TERM_MAP = _build_term_map()


# ═══════════════════════════════════════════════════════════════════════════════
# Classification Pipeline
# ═══════════════════════════════════════════════════════════════════════════════

V1_DATASET_NAMES_LOWER = set(n.lower() for n in V1_DATASET_NAMES)
V1_TOOL_NAMES_LOWER = set(n.lower() for n in V1_TOOL_NAMES)
V1_VENDOR_NAMES_LOWER = set(n.lower() for n in V1_VENDOR_NAMES)
V1_MATH_CONCEPTS_LOWER = set(n.lower() for n in V1_MATH_CONCEPTS)
V1_ARCH_KEYWORDS_LOWER = set(n.lower() for n in V1_ARCH_KEYWORDS)


def _classify_v1(title: str) -> tuple[str, str, str] | None:
    """Strategy 1: pattern-list matching."""
    lower = title.lower()

    for arch in V1_ARCH_KEYWORDS_LOWER:
        if arch in lower:
            return ("Neural Networks", "Core Models", "v1_pattern")
    for ds in V1_DATASET_NAMES_LOWER:
        if ds in lower:
            return ("Data Processing", "Data Pipeline", "v1_pattern")
    for tool in V1_TOOL_NAMES_LOWER:
        if re.search(rf"\b{re.escape(tool)}\b", lower):
            return ("Machine Learning Frameworks", "Automated Processes", "v1_pattern")
    for concept in V1_MATH_CONCEPTS_LOWER:
        if concept in lower:
            return ("Statistical Methods", "Bayesian Inference", "v1_pattern")
    for vendor in V1_VENDOR_NAMES_LOWER:
        if re.search(rf"(?<![a-z0-9]){re.escape(vendor)}(?![a-z0-9])", lower):
            return ("AI Applications", "", "v1_pattern")
    return None


def _classify_v2(title: str) -> tuple[str, str, str] | None:
    """Strategy 2: suffix/prefix regex patterns."""
    lower = title.lower().strip()

    # Check optimizer patterns first
    if re.search(r"(?i)^(?:ada|diff|mad|nove|ranger|quick|power|add|sm|smor|a2|ac|lion|nadam|rada|amoeba)"
                 r".*(?:grad|prop|sign|bound|belief|factor|delta|shift|smooth|sum|adam|sgd|optimizer)\b", lower):
        return ("Optimization Algorithms", "Gradient-Based Optimizers", "v2_optimizer")

    # Check tool names
    if lower in V2_TOOL_NAMES or V2_TOOL_SUFFIX.search(title):
        return ("Machine Learning Frameworks", "Automated Processes", "v2_tool")

    # Check dataset patterns
    if V2_DATASET_SUFFIX.search(title) or V2_DATASET_ACRONYM.match(title):
        return ("Data Processing", "Data Pipeline", "v2_dataset")

    # Check architecture suffixes
    if V2_ARCH_SUFFIX.search(title):
        return ("Neural Networks", "Core Models", "v2_architecture")

    return None


def _classify_v3(title: str) -> tuple[str, str, str] | None:
    """Strategy 3: explicit term mapping."""
    lower = title.lower().strip()

    # Exact match
    if lower in TERM_MAP:
        cat, sub = TERM_MAP[lower]
        return (cat, sub, "v3_exact")

    # Try with parenthetical stripped
    stripped = re.sub(r"\s*\([^)]*\)\s*", "", lower).strip()
    if stripped != lower and stripped in TERM_MAP:
        cat, sub = TERM_MAP[stripped]
        return (cat, sub, "v3_exact")

    return None


# Fix was applied for reviewer issues — FlashAttention, PagedAttention, Make.com
# are now in the consolidated TERM_MAP under the correct categories


def classify(title: str) -> tuple[str, str, str] | None:
    """Run all strategies in order until one produces a result."""
    # Try explicit mapping first (most accurate)
    result = _classify_v3(title)
    if result:
        return result

    # Try pattern-list matching
    result = _classify_v1(title)
    if result:
        return result

    # Try regex patterns
    result = _classify_v2(title)
    if result:
        return result

    return None


# ═══════════════════════════════════════════════════════════════════════════════
# Main
# ═══════════════════════════════════════════════════════════════════════════════

def main():
    parser = argparse.ArgumentParser(
        description="Consolidated taxonomy classification pipeline",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument("--terms-index", required=True, help="Path to terms/index.json")
    parser.add_argument("--registry", default="data/taxonomy-registry.json",
                        help="Path to taxonomy registry JSON")
    parser.add_argument("--out", help="Output proposals to file (no registry mutation)")
    parser.add_argument("--merge", action="store_true",
                        help="Merge proposals into the registry")
    parser.add_argument("--limit", type=int, default=0,
                        help="Limit to first N terms (for testing)")
    parser.add_argument("--backup", action="store_true",
                        help="Create a .bak backup before modifying registry")

    args = parser.parse_args()

    # Load terms
    terms = json.loads(Path(args.terms_index).read_text())
    unclassified = [t for t in terms if not t.get("taxonomy", {}).get("category")]
    print(f"Loaded {len(terms)} terms, {len(unclassified)} unclassified")

    if args.limit > 0:
        unclassified = unclassified[:args.limit]
        print(f"Limited to first {len(unclassified)} terms")

    # Load registry for key-checking (read-only unless --merge)
    if args.merge or args.out:
        registry_path = Path(args.registry)
        if registry_path.exists():
            registry = json.loads(registry_path.read_text())
        else:
            registry = {"entries": {}, "keyCount": 0}
        existing_keys = set(registry.get("entries", {}).keys())
        print(f"Registry has {len(existing_keys)} existing entries")
    else:
        existing_keys = set()
        print("Dry-run mode (no output file, no registry mutation)")

    proposals = []
    no_match = []

    for t in unclassified:
        key = normalize_key(t["title"])
        if key in existing_keys:
            continue

        result = classify(t["title"])
        if result:
            cat, sub, source = result
            proposals.append({
                "title": t["title"],
                "key": key,
                "category": cat,
                "subCategory": sub,
                "source": source,
            })
        else:
            no_match.append(t["title"])

    print(f"\nProposals: {len(proposals)}")
    print(f"No match:   {len(no_match)}")

    # Summary by source and category
    if proposals:
        src_counts = Counter(p["source"] for p in proposals)
        print(f"\n=== BY SOURCE ===")
        for src, count in src_counts.most_common():
            print(f"  {src}: {count}")

        cat_counts = Counter(p["category"] for p in proposals)
        print(f"\n=== BY CATEGORY ===")
        for cat, count in cat_counts.most_common():
            print(f"  {cat}: {count}")

    # Output proposals
    if args.out:
        out_path = Path(args.out)
        out_path.write_text(
            json.dumps({
                "proposals": proposals,
                "noMatch": no_match,
                "stats": {
                    "totalUnclassified": len(unclassified),
                    "proposed": len(proposals),
                    "noMatch": len(no_match),
                }
            }, ensure_ascii=False, indent=2) + "\n"
        )
        print(f"\nProposals written to {out_path}")

    # Merge into registry
    if args.merge:
        if args.backup:
            backup_path = registry_path.with_suffix(".bak.json")
            registry_path.rename(backup_path)
            print(f"Backup created at {backup_path}")

        entries = registry.get("entries", {})
        for p in proposals:
            entries[p["key"]] = {"category": p["category"], "subCategory": p["subCategory"]}

        registry["entries"] = entries
        registry["keyCount"] = len(entries)

        # Update category counts
        final_counts = Counter()
        for v in entries.values():
            final_counts[v.get("category", "Unclassified")] += 1
        registry["categoryCounts"] = dict(final_counts.most_common())

        registry_path.write_text(
            json.dumps(registry, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        print(f"Registry updated: {len(entries)} entries")

    # Show no-match terms
    if no_match:
        print(f"\n=== NO-MATCH TERMS ({len(no_match)}) ===")
        for i, t in enumerate(no_match[:30]):
            print(f"  {t}")
        if len(no_match) > 30:
            print(f"  ... and {len(no_match) - 30} more")

    return 0


if __name__ == "__main__":
    sys.exit(main())
