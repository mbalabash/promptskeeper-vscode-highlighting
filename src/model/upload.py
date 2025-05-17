from huggingface_hub import HfApi

repo_id = "mbalabash/distilbert_subjects_actions_objects_descriptors"

api = HfApi()

api.upload_file(
    path_or_fileobj="onnx-model/model.onnx",
    path_in_repo="model.onnx",
    repo_id=repo_id,
    repo_type="model"
)

api.upload_file(
    path_or_fileobj="onnx-model/model_quantized.onnx",
    path_in_repo="onnx/model_quantized.onnx",
    repo_id=repo_id,
    repo_type="model"
)

api.upload_file(
    path_or_fileobj="onnx-model/config.json",
    path_in_repo="config.json",
    repo_id=repo_id,
    repo_type="model"
)

api.upload_file(
    path_or_fileobj="distilbert-word-classifier/tokenizer.json",
    path_in_repo="tokenizer.json",
    repo_id=repo_id,
    repo_type="model"
)

api.upload_file(
    path_or_fileobj="distilbert-word-classifier/tokenizer_config.json",
    path_in_repo="tokenizer_config.json",
    repo_id=repo_id,
    repo_type="model"
)

api.upload_file(
    path_or_fileobj="distilbert-word-classifier/special_tokens_map.json",
    path_in_repo="special_tokens_map.json",
    repo_id=repo_id,
    repo_type="model"
)

api.upload_file(
    path_or_fileobj="info.md",
    path_in_repo="README.md",
    repo_id=repo_id,
    repo_type="model"
)


print(f"Model uploaded to: https://huggingface.co/{repo_id}")
