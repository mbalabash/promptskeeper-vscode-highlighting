# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [1.0.0]

### Added
- **Initial release** of **Prompts Highlighting for VSCode**.
- Automatically highlights groups of words (subjects, actions, objects, and descriptors) for better readability in prompt engineering workflows.
- **Word classification** is performed in two phases:
  1. **Heuristic Approach:** Quickly filters out known words (based on regex patterns) to assign categories if they match typical subject/action/object/descriptor suffixes.
  2. **Transformer Model Classification:** Ambiguous words are classified using a locally cached [Hugging Face model](https://huggingface.co/mbalabash/distilbert_subjects_actions_objects_descriptors) via the `@xenova/transformers` library. A prediction cache (`PREDICTION_CACHE`) ensures repeat classifications are quick.
  3. **Local cache** for downloaded model files located in `.cache/promptskeeper-vscode-highlighting-extension/models`.
- Activation on VSCode startup and support for untrusted workspaces.

### Changed
- N/A

### Removed
- N/A

---

> Please report any issues or feature requests on the [GitHub issue tracker](https://github.com/mbalabash/promptskeeper-vscode-highlighting/issues).
