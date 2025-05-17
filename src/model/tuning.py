import torch
import random
from pathlib import Path
from datasets import Dataset
from dataclasses import dataclass
from typing import Dict, List, Optional
from transformers import PreTrainedTokenizer, DistilBertForSequenceClassification, TrainingArguments, Trainer, AutoTokenizer


@dataclass
class WordClassificationConfig:
    model_name: str = "distilbert-base-cased"
    max_length: int = 16
    test_size: float = 0.1
    random_seed: int = 50
    num_epochs: int = 7
    batch_size: int = 32
    learning_rate: float = 2e-5
    output_dir: str = "./distilbert-word-classifier"


@dataclass
class DatasetItem:
    text: str
    label: str


class DatasetLoader:
    def __init__(self, file_paths: Dict[str, str], encoding: str = "utf-8"):
        self.file_paths = {k: Path(v) for k, v in file_paths.items()}
        self.encoding = encoding

    def validate_files(self) -> None:
        missing_files = [str(p)
                         for p in self.file_paths.values() if not p.exists()]
        if missing_files:
            raise FileNotFoundError(
                f"Files not found: {', '.join(missing_files)}")

    def load_data(self) -> List[DatasetItem]:
        self.validate_files()
        data: List[DatasetItem] = []

        for label, file_path in self.file_paths.items():
            try:
                with file_path.open("r", encoding=self.encoding) as f:
                    words = [line.strip() for line in f if line.strip()]
                    data.extend([DatasetItem(text=word, label=label)
                                for word in words])
            except UnicodeDecodeError as e:
                raise ValueError(f"Encoding error in {file_path}: {e}")

        return data


class WordClassifier:
    def __init__(self, config: WordClassificationConfig):
        self.config = config
        self.tokenizer: Optional[PreTrainedTokenizer] = None
        self.model: Optional[DistilBertForSequenceClassification] = None
        self.label2id: Dict[str, int] = {}
        self.id2label: Dict[int, str] = {}

    def setup_labels(self, class_names: List[str]) -> None:
        self.label2id = {lbl: i for i, lbl in enumerate(class_names)}
        self.id2label = {i: lbl for lbl, i in self.label2id.items()}

    def preprocess_function(self, examples: Dict[str, List]) -> Dict[str, torch.Tensor]:
        if not self.tokenizer:
            raise RuntimeError("Tokenizer not initialized")

        tokenized = self.tokenizer(
            examples["text"],
            max_length=self.config.max_length,
            truncation=True,
            padding="max_length"
        )

        tokenized["labels"] = [self.label2id[lbl] for lbl in examples["label"]]
        return tokenized

    def prepare_datasets(self, data: List[DatasetItem]) -> tuple:
        random.seed(self.config.random_seed)
        dataset = Dataset.from_list([vars(item) for item in data])
        split_dataset = dataset.train_test_split(
            test_size=self.config.test_size,
            seed=self.config.random_seed
        )

        for split in ["train", "test"]:
            split_dataset[split] = split_dataset[split].map(
                self.preprocess_function,
                batched=True,
                desc=f"Preprocessing {split}"
            )
            split_dataset[split].set_format(
                "torch",
                columns=["input_ids", "attention_mask", "labels"]
            )

        return split_dataset["train"], split_dataset["test"]

    def train(self, train_dataset, val_dataset) -> Dict[str, float]:
        if not self.model:
            raise RuntimeError("Model not initialized")

        training_args = TrainingArguments(
            output_dir=self.config.output_dir,
            overwrite_output_dir=True,
            num_train_epochs=self.config.num_epochs,
            per_device_train_batch_size=self.config.batch_size,
            per_device_eval_batch_size=self.config.batch_size,
            evaluation_strategy="epoch",
            save_strategy="epoch",
            logging_steps=50,
            learning_rate=self.config.learning_rate,
            load_best_model_at_end=True,
            metric_for_best_model="eval_loss"
        )

        trainer = Trainer(
            model=self.model,
            args=training_args,
            train_dataset=train_dataset,
            eval_dataset=val_dataset
        )

        try:
            trainer.train()
            self.tokenizer.save_pretrained(self.config.output_dir)
            return trainer.evaluate()
        except Exception as e:
            raise RuntimeError(f"Training failed: {e}")


def main():
    try:
        config = WordClassificationConfig()
        class_names = ["ACTION", "SUBJECT", "OBJECT", "DESCRIPTOR"]
        file_paths = {
            "ACTION": "./dataset/actions.txt",
            "SUBJECT": "./dataset/subjects.txt",
            "OBJECT": "./dataset/objects.txt",
            "DESCRIPTOR": "./dataset/descriptors.txt"
        }

        # Initialize loader and load data
        loader = DatasetLoader(file_paths)
        data = loader.load_data()

        # Initialize classifier
        classifier = WordClassifier(config)
        classifier.setup_labels(class_names)

        # Initialize tokenizer and model
        classifier.tokenizer = AutoTokenizer.from_pretrained(config.model_name)
        classifier.model = DistilBertForSequenceClassification.from_pretrained(
            config.model_name,
            num_labels=len(class_names),
            id2label=classifier.id2label,
            label2id=classifier.label2id
        )

        # Prepare datasets and train
        train_dataset, val_dataset = classifier.prepare_datasets(data)
        metrics = classifier.train(train_dataset, val_dataset)
        print(metrics)

    except Exception as e:
        print(f"Error during execution: {e}")
        raise


if __name__ == "__main__":
    main()
