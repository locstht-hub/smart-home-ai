from __future__ import annotations

import argparse
import json
from pathlib import Path

import unsloth  # noqa: F401 - keep first so Unsloth patches the runtime.
import torch
from peft import PeftModel
from transformers import TextStreamer
from unsloth import FastLanguageModel


def load_questions(path: Path) -> list[dict]:
    rows: list[dict] = []
    with path.open(encoding="utf-8") as handle:
        for line in handle:
            if line.strip():
                rows.append(json.loads(line))
    return rows


def generate_answer(model, tokenizer, system_prompt: str, question: str, max_new_tokens: int) -> str:
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": question},
    ]
    inputs = tokenizer.apply_chat_template(
        messages,
        tokenize=True,
        add_generation_prompt=True,
        return_tensors="pt",
    ).to("cuda")

    with torch.inference_mode():
        output = model.generate(
            input_ids=inputs,
            max_new_tokens=max_new_tokens,
            temperature=0.4,
            top_p=0.9,
            do_sample=True,
            pad_token_id=tokenizer.eos_token_id,
        )

    generated = output[0][inputs.shape[-1] :]
    return tokenizer.decode(generated, skip_special_tokens=True).strip()


def main() -> None:
    parser = argparse.ArgumentParser(description="Run User Energy Assistant LoRA evaluation questions.")
    parser.add_argument("--base_model", default="unsloth/Qwen2.5-1.5B-Instruct-bnb-4bit")
    parser.add_argument("--adapter_path", default="assistant-user-energy-lora")
    parser.add_argument("--questions", default="test_questions.jsonl")
    parser.add_argument("--system_prompt", default="system_prompt.txt")
    parser.add_argument("--output", default="test_outputs/user_energy_eval_outputs.jsonl")
    parser.add_argument("--max_seq_length", type=int, default=1024)
    parser.add_argument("--max_new_tokens", type=int, default=220)
    parser.add_argument("--stream_first", action="store_true")
    args = parser.parse_args()

    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    questions = load_questions(Path(args.questions))
    system_prompt = Path(args.system_prompt).read_text(encoding="utf-8")

    model, tokenizer = FastLanguageModel.from_pretrained(
        model_name=args.base_model,
        max_seq_length=args.max_seq_length,
        dtype=None,
        load_in_4bit=True,
    )
    model = PeftModel.from_pretrained(model, args.adapter_path)
    FastLanguageModel.for_inference(model)

    if args.stream_first and questions:
        first = questions[0]
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": first["question"]},
        ]
        inputs = tokenizer.apply_chat_template(
            messages,
            tokenize=True,
            add_generation_prompt=True,
            return_tensors="pt",
        ).to("cuda")
        streamer = TextStreamer(tokenizer, skip_prompt=True, skip_special_tokens=True)
        _ = model.generate(
            input_ids=inputs,
            streamer=streamer,
            max_new_tokens=args.max_new_tokens,
            temperature=0.4,
            top_p=0.9,
            do_sample=True,
            pad_token_id=tokenizer.eos_token_id,
        )

    with output_path.open("w", encoding="utf-8", newline="\n") as handle:
        for index, item in enumerate(questions, 1):
            answer = generate_answer(model, tokenizer, system_prompt, item["question"], args.max_new_tokens)
            result = {
                "id": item["id"],
                "category": item.get("category", ""),
                "question": item["question"],
                "expected": item.get("expected", ""),
                "forbidden": item.get("forbidden", []),
                "no_number": item.get("no_number", False),
                "answer": answer,
            }
            handle.write(json.dumps(result, ensure_ascii=False, separators=(",", ":")) + "\n")
            print(f"[{index:02d}/{len(questions)}] {item['id']} done")

    print(f"Wrote {output_path}")


if __name__ == "__main__":
    main()
