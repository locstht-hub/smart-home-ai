# Smart Home AI User Energy Assistant Dataset

Dataset này dùng để fine-tune chatbot **User Energy Assistant** cho người dùng trong app Smart Home AI.

## Mục tiêu

- Giải thích dữ liệu điện năng bằng tiếng Việt dễ hiểu.
- Phân biệt đúng `V`, `I`, `kW`, `kWh`.
- Hỗ trợ quota/hạn mức, cảnh báo vượt quota, tài khoản cha/con và quyền điều khiển.
- Giải thích forecast, dữ liệu realtime, cache, mock, `plc-real`, biểu đồ và trạng thái thiết bị.
- Dạy chatbot không bịa số liệu nếu backend/app chưa cung cấp dữ liệu thật.
- Tách khỏi Project Assistant, không trả lời sâu về GitHub, bài báo, phản biện đồ án hoặc kỹ thuật PLC chuyên sâu.

## File

```text
build_dataset.py
train.jsonl
eval.jsonl
system_prompt.txt
requirements.txt
train_unsloth_user_energy.py
TEST_PLAN.md
test_questions.jsonl
run_lora_eval.py
score_lora_eval.py
```

## Dataset hiện tại

Sau khi chạy `build_dataset.py`:

```text
train.jsonl: 329 rows
eval.jsonl: 39 rows
```

`train.jsonl` dùng để model học. `eval.jsonl` dùng để theo dõi trong lúc train, không nên trộn ngược vào train.

## Sinh lại dataset

```bash
python build_dataset.py
```

## Train trên Colab

```bash
pip install -r requirements.txt

python train_unsloth_user_energy.py \
  --train_dataset train.jsonl \
  --eval_dataset eval.jsonl \
  --system_prompt system_prompt.txt \
  --model unsloth/Qwen2.5-1.5B-Instruct-bnb-4bit \
  --output_dir assistant-user-energy-lora \
  --epochs 4 \
  --max_seq_length 1024
```

Output adapter:

```text
assistant-user-energy-lora/
```

## Test sau train

```bash
python run_lora_eval.py \
  --adapter_path assistant-user-energy-lora \
  --questions test_questions.jsonl \
  --output test_outputs/user_energy_eval_outputs.jsonl

python score_lora_eval.py \
  --input test_outputs/user_energy_eval_outputs.jsonl \
  --report test_outputs/user_energy_eval_report.md
```

## Nguyên tắc quan trọng

Fine-tune chỉ dạy chatbot **cách trả lời, phạm vi và thái độ an toàn**. Số liệu thật như kWh hôm nay, quota còn lại, trạng thái thiết bị, log hoạt động hoặc forecast phải được backend/app đưa vào ngữ cảnh khi gọi chatbot.
