## Model summary

Based on **`distilbert-base-cased`** and fine-tuned to predict 4 word classes: subjects, actions, objects, and descriptors.

## How to use

### Python (ONNX Runtime)

```sh
pip install onnxruntime transformers huggingface_hub numpy
```

```python
import numpy as np
import onnxruntime as ort
from transformers import AutoTokenizer
from huggingface_hub import hf_hub_download

onnx_model_path = hf_hub_download(
    "mbalabash/distilbert_subjects_actions_objects_descriptors", "model.onnx")
tokenizer = AutoTokenizer.from_pretrained("distilbert-base-cased")
id2label = {0: "ACTION", 1: "SUBJECT", 2: "OBJECT", 3: "DESCRIPTOR"}

session = ort.InferenceSession(onnx_model_path)


def classify_word(word):
    inputs = tokenizer(word, return_tensors="np")
    output = session.run(None, {
        "input_ids": inputs["input_ids"].astype(np.int64),
        "attention_mask": inputs["attention_mask"].astype(np.int64)
    })

    predicted_class_id = np.argmax(output[0])
    return id2label[predicted_class_id]


test_words = ["run", "teacher", "apple", "beautiful"]
for word in test_words:
    print(f"{word}: {classify_word(word)}")

# OUTPUT ->
# run: ACTION
# teacher: SUBJECT
# apple: OBJECT
# beautiful: DESCRIPTOR
```

### JavaScript (transformers.js)

```sh
npm install @xenova/transformers
```

```js
import { pipeline } from "@xenova/transformers";

const classifier = await pipeline("text-classification", "mbalabash/distilbert_subjects_actions_objects_descriptors");

const testWords = ["run", "teacher", "apple", "beautiful"];

for (const word of testWords) {
    const result = await classifier(word);
    console.log(`${word}: ${result[0].label}`);
}

// OUTPUT ->
// run: ACTION
// teacher: SUBJECT
// apple: OBJECT
// beautiful: DESCRIPTOR
```

## Examples

```
Prediction Results:
--------------------------------------------------
run             -> ACTION     (confidence: 91.83%)
jump            -> ACTION     (confidence: 98.68%)
deploy          -> ACTION     (confidence: 99.90%)
considering     -> ACTION     (confidence: 99.85%)
training        -> ACTION     (confidence: 51.41%)
make            -> ACTION     (confidence: 99.71%)
teacher         -> SUBJECT    (confidence: 99.96%)
doctor          -> SUBJECT    (confidence: 99.95%)
woman           -> SUBJECT    (confidence: 99.96%)
viewer          -> SUBJECT    (confidence: 99.95%)
wizard          -> SUBJECT    (confidence: 99.97%)
pilot           -> SUBJECT    (confidence: 85.33%)
banana          -> OBJECT     (confidence: 99.69%)
laptop          -> OBJECT     (confidence: 99.95%)
dog             -> OBJECT     (confidence: 50.54%)
pencil          -> OBJECT     (confidence: 99.91%)
flower          -> OBJECT     (confidence: 56.07%)
car             -> OBJECT     (confidence: 82.67%)
beautiful       -> DESCRIPTOR (confidence: 99.90%)
urgent          -> DESCRIPTOR (confidence: 57.71%)
successful      -> DESCRIPTOR (confidence: 99.94%)
frequently      -> DESCRIPTOR (confidence: 99.95%)
strategic       -> DESCRIPTOR (confidence: 99.42%)
faithful        -> DESCRIPTOR (confidence: 99.91%)
```

## License (MIT)

Copyright © 2025 [Maksim Balabash](mailto:maksim.balabash@gmail.com)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
