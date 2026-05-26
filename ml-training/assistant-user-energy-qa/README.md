# Smart Home AI User Energy Assistant Dataset

Dataset này dùng để chuẩn bị fine-tune một trợ lý tiếng Việt bằng Unsloth cho **người dùng app Smart Home AI**.

Mục tiêu:

- Giải thích dữ liệu điện năng bằng tiếng Việt dễ hiểu.
- Hỗ trợ người dùng đọc quota/hạn mức.
- Giải thích forecast/dự báo phụ tải ở mức người dùng cuối.
- Gợi ý tiết kiệm điện dựa trên dữ liệu, quota và xu hướng.
- Hướng dẫn người dùng xử lý lỗi dữ liệu, mất kết nối, biểu đồ trống hoặc forecast chưa có.
- Tách khỏi Project Assistant, không trả lời về GitHub, bài báo, commit, phản biện đồ án hoặc tiến độ dự án.

## File

```text
build_dataset.py
train.jsonl
eval.jsonl
system_prompt.txt
requirements.txt
train_unsloth_user_energy.py
TEST_PLAN.md
```

## Format

Mỗi dòng JSONL dùng dạng chat messages:

```json
{"messages":[{"role":"user","content":"Câu hỏi"},{"role":"assistant","content":"Câu trả lời"}]}
```

## Sinh lại dataset

```bash
python build_dataset.py
```

## Chạy thử trên Colab

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

Sau khi chạy xong, LoRA adapter sẽ nằm trong:

```text
assistant-user-energy-lora/
```

## Ghi chú

Dataset này là bản đầu để train thử User Assistant. Sau khi train, nên test các câu hỏi thực tế từ app rồi bổ sung thêm các mẫu model trả lời yếu.

Kế hoạch test chi tiết nằm ở:

```text
TEST_PLAN.md
```
