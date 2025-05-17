import torch
import logging
from pathlib import Path
from dataclasses import dataclass
from typing import List, Dict, Optional
from transformers import AutoTokenizer, DistilBertForSequenceClassification, PreTrainedTokenizer

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class PredictionConfig:
    model_dir: Path
    tokenizer_dir: Path
    device: str = "cuda" if torch.cuda.is_available() else "cpu"


@dataclass
class PredictionResult:
    word: str
    label: str
    confidence: float
    all_probabilities: Dict[str, float]


class WordCategoryPredictor:
    def __init__(self, config: PredictionConfig):
        """Initialize the predictor with model and tokenizer."""
        self.config = config
        self.model: Optional[DistilBertForSequenceClassification] = None
        self.tokenizer: Optional[PreTrainedTokenizer] = None

    def load_model(self) -> None:
        """Load model and tokenizer with error handling."""
        try:
            self.model = DistilBertForSequenceClassification.from_pretrained(
                self.config.model_dir
            ).to(self.config.device)
            self.model.eval()

            self.tokenizer = AutoTokenizer.from_pretrained(
                self.config.tokenizer_dir
            )
            logger.info(
                f"Model and tokenizer loaded successfully. Using device: {self.config.device}")

        except Exception as e:
            logger.error(f"Failed to load model or tokenizer: {e}")
            raise RuntimeError("Model initialization failed") from e

    def predict(self, word: str) -> PredictionResult:
        """Predict category for a single word with confidence scores."""
        if not self.model or not self.tokenizer:
            raise RuntimeError("Model or tokenizer not initialized")

        try:
            # Tokenize and move to appropriate device
            inputs = self.tokenizer(
                word,
                return_tensors="pt",
                truncation=True,
                max_length=16
            ).to(self.config.device)

            # Get model predictions
            with torch.no_grad():
                outputs = self.model(**inputs)

            # Get probabilities using softmax
            probabilities = torch.nn.functional.softmax(outputs.logits, dim=-1)
            predicted_class_id = probabilities.argmax(dim=-1).item()
            confidence = probabilities[0, predicted_class_id].item()

            # Get label mapping from model config
            predicted_label = self.model.config.id2label[predicted_class_id]

            # Create probability dictionary for all classes
            all_probs = {
                self.model.config.id2label[i]: prob.item()
                for i, prob in enumerate(probabilities[0])
            }

            return PredictionResult(
                word=word,
                label=predicted_label,
                confidence=confidence,
                all_probabilities=all_probs
            )

        except Exception as e:
            logger.error(f"Prediction failed for word '{word}': {e}")
            raise

    def predict_batch(self, words: List[str], batch_size: int = 32) -> List[PredictionResult]:
        """Predict categories for multiple words in batches."""
        results = []

        for i in range(0, len(words), batch_size):
            batch = words[i:i + batch_size]
            try:
                # Tokenize batch
                inputs = self.tokenizer(
                    batch,
                    return_tensors="pt",
                    truncation=True,
                    max_length=16,
                    padding=True
                ).to(self.config.device)

                # Get predictions
                with torch.no_grad():
                    outputs = self.model(**inputs)

                # Process batch results
                probabilities = torch.nn.functional.softmax(
                    outputs.logits, dim=-1)
                predicted_classes = probabilities.argmax(dim=-1)

                for j, (word, probs, pred_class) in enumerate(zip(batch, probabilities, predicted_classes)):
                    confidence = probs[pred_class].item()
                    predicted_label = self.model.config.id2label[pred_class.item(
                    )]

                    all_probs = {
                        self.model.config.id2label[k]: p.item()
                        for k, p in enumerate(probs)
                    }

                    results.append(PredictionResult(
                        word=word,
                        label=predicted_label,
                        confidence=confidence,
                        all_probabilities=all_probs
                    ))

            except Exception as e:
                logger.error(
                    f"Batch prediction failed for batch starting with '{batch[0]}': {e}")
                raise

        return results


def main():
    config = PredictionConfig(
        model_dir=Path("./distilbert-word-classifier/checkpoint-4193"),
        tokenizer_dir=Path("./distilbert-word-classifier")
    )

    test_words = [
        "run", "jump", "deploy", "considering", "training", "make",
        "teacher", "doctor", "woman", "viewer", "wizard", "pilot",
        "banana", "laptop", "dog", "pencil", "flower", "car",
        "beautiful", "urgent", "successful", "frequently", "strategic", "faithful"
    ]

    try:
        predictor = WordCategoryPredictor(config)
        predictor.load_model()
        results = predictor.predict_batch(test_words)

        print("\nPrediction Results:")
        print("-" * 50)
        for result in results:
            print(
                f"{result.word:<15} -> {result.label:<10} (confidence: {result.confidence:.2%})")

        for result in results:
            print("\nDetailed Probabilities for word:", result.word)
            print("-" * 50)
            for label, prob in result.all_probabilities.items():
                print(f"{label:<10}: {prob:.2%}")

    except Exception as e:
        logger.error(f"Prediction failed: {e}")
        raise


if __name__ == "__main__":
    main()
