from onnxruntime.quantization import quantize_dynamic, QuantType

onnx_model_path = "onnx-model/model.onnx"
quantized_model_path = "onnx-model/model_quantized.onnx"

quantize_dynamic(
    model_input=onnx_model_path,
    model_output=quantized_model_path,
    weight_type=QuantType.QInt8,
)
