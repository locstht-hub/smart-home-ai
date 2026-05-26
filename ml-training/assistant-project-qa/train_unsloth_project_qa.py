from __future__ import annotations

import unsloth  # noqa: F401 - must be imported before trl/transformers for Unsloth patching.
import argparse
import json
from pathlib import Path
from typing import Any

from datasets import load_dataset
from trl import SFTConfig, SFTTrainer
from unsloth import FastLanguageModel, is_bfloat16_supported


DEFAULT_SYSTEM_PROMPT = (
    "Ban la tro ly tieng Viet cua du an Smart Home AI. "
    "Hay tra loi khach quan, ngan gon, dung pham vi tai lieu. "
    "Khong phong dai nhung phan chua duoc kiem thu thuc te."
)


def read_system_prompt(path: Path | None) -> str:
    if path is None or not path.exists():
        return DEFAULT_SYSTEM_PROMPT
    return path.read_text(encoding="utf-8").strip() or DEFAULT_SYSTEM_PROMPT


def normalize_messages(row: dict[str, Any], system_prompt: str) -> list[dict[str, str]]:
    messages = row.get("messages")
    if not isinstance(messages, list) or len(messages) < 2:
        raise ValueError("Each row must contain a messages list with user and assistant turns.")

    normalized: list[dict[str, str]] = [{"role": "system", "content": system_prompt}]
    for message in messages:
        role = str(message.get("role", "")).strip()
        content = str(message.get("content", "")).strip()
        if role not in {"user", "assistant"}:
            continue
        if content:
            normalized.append({"role": role, "content": content})

    if len(normalized) < 3:
        raise ValueError("Each row must contain at least one user turn and one assistant turn.")
    return normalized


def format_example(row: dict[str, Any], tokenizer: Any, system_prompt: str) -> str:
    messages = normalize_messages(row, system_prompt)
    if hasattr(tokenizer, "apply_chat_template") and tokenizer.chat_template:
        return tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=False)

    parts = []
    for message in messages:
        parts.append(f"<|im_start|>{message['role']}\n{message['content']}<|im_end|>")
    return "\n".join(parts)


def build_dataset(path: Path, tokenizer: Any, system_prompt: str):
    dataset = load_dataset("json", data_files=str(path), split="train")
    return dataset.map(
        lambda row: {"text": format_example(row, tokenizer, system_prompt)},
        remove_columns=dataset.column_names,
    )


def main() -> None:
    parser = argparse.ArgumentParser(description="Fine-tune Smart Home AI project QA assistant with Unsloth.")
    parser.add_argument("--train_dataset", default="train.jsonl")
    parser.add_argument("--eval_dataset", default="eval.jsonl")
    parser.add_argument("--system_prompt", default="system_prompt.txt")
    parser.add_argument("--model", default="unsloth/Qwen2.5-1.5B-Instruct-bnb-4bit")
    parser.add_argument("--output_dir", default="assistant-project-qa-lora")
    parser.add_argument("--max_seq_length", type=int, default=1024)
    parser.add_argument("--epochs", type=int, default=4)
    parser.add_argument("--learning_rate", type=float, default=2e-4)
    parser.add_argument("--batch_size", type=int, default=2)
    parser.add_argument("--gradient_accumulation_steps", type=int, default=4)
    parser.add_argument("--lora_rank", type=int, default=16)
    parser.add_argument("--seed", type=int, default=3407)
    args = parser.parse_args()

    train_path = Path(args.train_dataset)
    eval_path = Path(args.eval_dataset)
    prompt_path = Path(args.system_prompt)

    if not train_path.exists():
        raise FileNotFoundError(train_path)

    system_prompt = read_system_prompt(prompt_path)

    model, tokenizer = FastLanguageModel.from_pretrained(
        model_name=args.model,
        max_seq_length=args.max_seq_length,
        dtype=None,
        load_in_4bit=True,
    )

    model = FastLanguageModel.get_peft_model(
        model,
        r=args.lora_rank,
        target_modules=["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
        lora_alpha=args.lora_rank,
        lora_dropout=0,
        bias="none",
        use_gradient_checkpointing="unsloth",
        random_state=args.seed,
    )

    train_dataset = build_dataset(train_path, tokenizer, system_prompt)
    eval_dataset = build_dataset(eval_path, tokenizer, system_prompt) if eval_path.exists() else None

    trainer = SFTTrainer(
        model=model,
        processing_class=tokenizer,
        train_dataset=train_dataset,
        eval_dataset=eval_dataset,
        args=SFTConfig(
            per_device_train_batch_size=args.batch_size,
            gradient_accumulation_steps=args.gradient_accumulation_steps,
            warmup_steps=5,
            num_train_epochs=args.epochs,
            learning_rate=args.learning_rate,
            fp16=not is_bfloat16_supported(),
            bf16=is_bfloat16_supported(),
            logging_steps=5,
            eval_strategy="epoch" if eval_dataset is not None else "no",
            save_strategy="epoch",
            optim="adamw_8bit",
            weight_decay=0.01,
            lr_scheduler_type="linear",
            seed=args.seed,
            output_dir=args.output_dir,
            report_to="none",
            dataset_text_field="text",
            max_length=args.max_seq_length,
            packing=False,
        ),
    )

    trainer.train()
    model.save_pretrained(args.output_dir)
    tokenizer.save_pretrained(args.output_dir)

    metadata = {
        "base_model": args.model,
        "train_dataset": str(train_path),
        "eval_dataset": str(eval_path) if eval_path.exists() else None,
        "output_dir": args.output_dir,
        "task": "smart_home_ai_project_qa",
        "excluded_scope": "detailed electrical implementation and field wiring guidance",
        "num_train_rows": len(train_dataset),
        "num_eval_rows": len(eval_dataset) if eval_dataset is not None else 0,
        "max_seq_length": args.max_seq_length,
        "epochs": args.epochs,
        "learning_rate": args.learning_rate,
        "lora_rank": args.lora_rank,
    }
    Path(args.output_dir, "project_qa_metadata.json").write_text(
        json.dumps(metadata, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
