# Smart Home AI Project QA Dataset

Dataset này dùng để chuẩn bị fine-tune mô hình tiếng Việt bằng Unsloth theo hướng **trợ lý hỏi đáp dự án Smart Home AI**.

Mục tiêu của dataset:

- Trả lời câu hỏi về tổng quan dự án.
- Giải thích kiến trúc phần mềm: app, backend, database, Forecast API.
- Giải thích vai trò của AI dự báo phụ tải.
- Phân biệt AI forecast với Unsloth/LLM.
- Hỗ trợ trả lời phản biện khoa học ở mức phần mềm/prototype.
- Hướng dẫn người đọc hiểu dự án đã làm gì và chưa có gì.

Phạm vi loại trừ theo yêu cầu:

- Không đưa nội dung triển khai điện chi tiết.
- Không hướng dẫn thi công hoặc cấu hình hiện trường.
- Không đưa hướng dẫn kỹ thuật có rủi ro an toàn.
- Không huấn luyện model trả lời như một kỹ sư thi công điện.

## File

```text
train.jsonl  # 200 mẫu huấn luyện
eval.jsonl   # 16 mẫu kiểm thử
system_prompt.txt
requirements.txt
train_unsloth_project_qa.py
```

## Format

Mỗi dòng JSONL dùng dạng chat messages:

```json
{"messages":[{"role":"user","content":"Câu hỏi"},{"role":"assistant","content":"Câu trả lời"}]}
```

## Gợi ý dùng với Unsloth

Dataset này phù hợp với supervised fine-tuning cho model instruct nhỏ/trung bình như Qwen/Gemma/Llama instruct.

Nên dùng `eval.jsonl` để kiểm tra model sau fine-tune và không trộn file này vào train.

## Chạy thử trên Colab

```bash
pip install -r requirements.txt
python train_unsloth_project_qa.py \
  --train_dataset train.jsonl \
  --eval_dataset eval.jsonl \
  --system_prompt system_prompt.txt \
  --model unsloth/Qwen2.5-1.5B-Instruct-bnb-4bit \
  --output_dir assistant-project-qa-lora \
  --epochs 4 \
  --max_seq_length 1024
```

Sau khi chạy xong, LoRA adapter sẽ nằm trong:

```text
assistant-project-qa-lora/
```

## Ghi chú

Dataset hiện tại đủ để train thử vòng đầu và đánh giá pipeline. Sau khi train thử, nên bổ sung tiếp các mẫu mà model còn trả lời yếu để tiến tới khoảng 500 mẫu chất lượng.
