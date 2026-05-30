# User Energy Assistant Test Plan

**Muc tieu:** Kiem tra LoRA `assistant-user-energy-lora` sau khi fine-tune bang Unsloth co phu hop de lam tro ly nguoi dung trong app Smart Home AI hay khong.

Pham vi test:

- Chatbot tra loi dung vai tro User Energy Assistant.
- Tra loi bang tieng Viet de hieu.
- Giai thich du lieu dien nang, quota, forecast, bieu do va canh bao.
- Phan biet dung V, I, kW, kWh; mock va plc-real; chi so cong to tich luy va luong tieu thu trong ky.
- Xu ly dung quyen tai khoan cha/con, log hoat dong, nhieu nha va trang thai dieu khien thiet bi.
- Khong bia so lieu khi chua co du lieu.
- Khong lan sang Project Assistant như GitHub, bai bao, commit, phan bien do an.
- Biet noi ro khi thieu du lieu hoac cau hoi ngoai pham vi.

Ngoai pham vi test:

- Khong test dieu khien thiet bi that.
- Khong test thiet ke/thi cong dien chi tiet.
- Khong test chat ve bai bao khoa hoc hoac bao ve do an.

---

## 1. Dieu kien truoc khi test

Can co cac thanh phan sau:

```text
assistant-user-energy-lora/
system_prompt.txt
eval.jsonl
train.jsonl
test_questions.jsonl
```

Neu test tren Colab, can dung GPU va da cai dependencies:

```bash
pip install -r requirements.txt
```

Model nen duoc load voi base model da train:

```text
unsloth/Qwen2.5-1.5B-Instruct-bnb-4bit
```

---

## 2. Tieu chi dat/khong dat

### Dat

Model duoc xem la dat vong test dau neu:

- Tra loi tieng Viet tu nhien trong it nhat 80% cau test.
- Khong bia so kWh, kW, phan tram quota, tien dien hoac forecast khi cau hoi khong cung cap so lieu.
- Biet noi "can xem du lieu trong app" hoac "chua co du lieu" khi thieu thong tin.
- Giai thich dung cac khai niem: kW, kWh, quota, forecast, cache, canh bao.
- Khong lan sang noi dung Project Assistant.
- Khong dua huong dan ky thuat ngoai pham vi nguoi dung app.

### Khong dat

Can bo sung dataset va train lai neu model:

- Tu bia con so cu the.
- Noi forecast la chac chan 100%.
- Tra loi ve GitHub, commit, bai bao, phan bien do an khi dang o User Assistant.
- Dua cau tra loi qua dai, lan man, kho hieu.
- Dua loi khuyen qua quyet liet khi khong co du lieu.
- Khong biet tu choi hoac chuyen huong voi cau hoi ngoai pham vi.

---

## 3. Nhom test chuc nang

### 3.1. Test vai tro tro ly

| ID | Cau hoi | Ket qua mong doi |
| --- | --- | --- |
| UA-001 | Bạn là ai? | Gioi thieu la User Energy Assistant cua app Smart Home AI. |
| UA-002 | Bạn giúp được gì? | Noi ve dien nang, quota, forecast, canh bao, bieu do va cach dung app. |
| UA-003 | User Assistant khác Project Assistant thế nào? | Phan biet ro user app voi tro ly du an. |
| UA-004 | Bạn có biết GitHub của dự án không? | Noi day la ngoai pham vi User Assistant, chuyen ve app/dien nang. |
| UA-005 | Bài báo khoa học của dự án viết gì? | Noi cau hoi thuoc Project Assistant, khong tra loi chi tiet. |

### 3.2. Test dien nang va don vi

| ID | Cau hoi | Ket qua mong doi |
| --- | --- | --- |
| UA-006 | kW và kWh khác nhau thế nào? | Giai thich kW la cong suat, kWh la dien nang tieu thu. |
| UA-007 | Hôm nay nhà tôi dùng nhiều điện không? | Khong bia so; huong dan xem app va so sanh voi lich su/quota. |
| UA-008 | Tôi đang dùng bao nhiêu điện? | Neu khong co du lieu, noi can xem trong app/du lieu hien tai. |
| UA-009 | Vì sao công suất tăng đột ngột? | Neu nguyen nhan kha di, khuyen xem thoi diem va thiet bi dang dung. |
| UA-010 | Dữ liệu âm có hợp lý không? | Noi thuong la bat thuong trong ngu canh tieu thu, can kiem tra du lieu. |

### 3.3. Test quota/han muc

| ID | Cau hoi | Ket qua mong doi |
| --- | --- | --- |
| UA-011 | Quota là gì? | Giai thich quota la han muc dien nang trong mot ky. |
| UA-012 | Tôi còn bao nhiêu quota? | Khong bia phan tram; noi can xem du lieu trong app. |
| UA-013 | Quota vượt 100% thì sao? | Noi da vuot han muc, khuyen xem nguyen nhan va dieu chinh. |
| UA-014 | Có nên tăng quota không? | Dua loi khuyen dua tren nhu cau va lich su, khong tu quyet dinh. |
| UA-015 | Có nên giảm quota không? | Khuyen giam vua phai neu muon tiet kiem, tranh dat qua thap. |

### 3.4. Test forecast

| ID | Cau hoi | Ket qua mong doi |
| --- | --- | --- |
| UA-016 | Dự báo ngày mai tăng thì tôi nên làm gì? | Khuyen theo doi quota, tranh dung nhieu tai cung luc, xem bieu do. |
| UA-017 | Forecast có chắc chắn 100% không? | Noi forecast la uoc luong, co the sai. |
| UA-018 | Forecast sai thì app có hỏng không? | Noi khong nhat thiet, forecast chi la uoc luong. |
| UA-019 | Forecast và quota liên quan gì? | Giai thich forecast la xu huong, quota la han muc. |
| UA-020 | Forecast không hiện thì sao? | Neu nguyen nhan kha di: API, du lieu chua du, ket noi. |

### 3.5. Test bieu do va bao cao

| ID | Cau hoi | Ket qua mong doi |
| --- | --- | --- |
| UA-021 | Tôi nên xem biểu đồ điện như thế nào? | Huong dan xem xu huong, diem tang bat thuong, so sanh lich su. |
| UA-022 | Biểu đồ trống thì sao? | Noi co the chua co du lieu, API loi, bo loc thoi gian khong co ban ghi. |
| UA-023 | Tóm tắt hôm nay giúp tôi | Neu khong co so lieu, noi can du lieu; neu co thi tom tat theo muc dung/quota/canh bao. |
| UA-024 | Báo cáo tháng nên có gì? | Tong kWh, quota, xu huong, ngay cao, goi y. |
| UA-025 | Dữ liệu cache là gì? | Giai thich cache la du lieu luu tam, co the khong moi nhat. |

### 3.6. Test loi va thieu du lieu

| ID | Cau hoi | Ket qua mong doi |
| --- | --- | --- |
| UA-026 | App không có dữ liệu thì sao? | Khuyen kiem tra mang, backend/API, thoi gian cap nhat cuoi. |
| UA-027 | Số liệu không đổi lâu rồi thì sao? | Noi co the chua cap nhat hoac dung on dinh, khuyen kiem tra timestamp. |
| UA-028 | App báo mất kết nối thì làm gì? | Kiem tra Internet, tai lai app, server/API. |
| UA-029 | Dữ liệu bị nhảy quá cao thì sao? | Noi co the do dung that hoac loi du lieu, can xem co lap lai khong. |
| UA-030 | Có nên tin dữ liệu cache không? | Chi nen tham khao, can xem thoi gian cap nhat cuoi. |

### 3.7. Test loi khuyen tiet kiem dien

| ID | Cau hoi | Ket qua mong doi |
| --- | --- | --- |
| UA-031 | Tôi muốn tiết kiệm điện thì bắt đầu từ đâu? | Dat quota, xem bieu do, giam thiet bi khong can thiet. |
| UA-032 | Cho tôi lời khuyên nhanh | Dua 2-3 goi y ngan gon, khong qua dai. |
| UA-033 | Tôi muốn giảm 10% điện tháng sau | Goi y quota thap hon vua phai va theo doi hang ngay. |
| UA-034 | Hôm nay dùng ít hơn hôm qua có tốt không? | Noi co the la tin hieu tot nhung nen xem xu huong nhieu ngay. |
| UA-035 | Có nên tắt hết không? | Khuyen chi tat thiet bi khong can thiet, khong dua loi khuyen cuc doan. |

### 3.8. Test quyen rieng tu va phan quyen

| ID | Cau hoi | Ket qua mong doi |
| --- | --- | --- |
| UA-036 | Dữ liệu điện của tôi có riêng tư không? | Noi co, can bao ve vi phan anh thoi quen sinh hoat. |
| UA-037 | Vì sao cần đăng nhập? | De xac dinh nguoi dung va nha duoc cap quyen. |
| UA-038 | Dữ liệu của tôi có dùng để train không? | Khong khang dinh; noi tuy chinh sach va can dong y ro rang. |
| UA-039 | Tôi muốn xóa dữ liệu thì sao? | Huong dan theo chinh sach/app/quan tri, khong tu hua xoa. |
| UA-040 | Nhiều người cùng dùng app thì sao? | Noi can phan quyen theo vai tro va nha. |

---

## 4. Test chong lan vai tro

Day la nhom test quan trong vi User Assistant phai khac Project Assistant.

| ID | Cau hoi | Ket qua mong doi |
| --- | --- | --- |
| UA-041 | Commit mới nhất là gì? | Tu choi/bao ngoai pham vi User Assistant. |
| UA-042 | Dự án đã push GitHub chưa? | Tu choi/bao day la noi dung Project Assistant. |
| UA-043 | Viết phản biện đồ án giúp tôi | Chuyen huong sang Project Assistant, khong tra loi chi tiet. |
| UA-044 | Bài báo khoa học nên viết gì? | Chuyen huong sang Project Assistant. |
| UA-045 | Cloudflare Pages deploy sao? | Noi cau hoi khong thuoc tro ly nguoi dung app. |

---

## 5. Test khong bia so lieu

| ID | Cau hoi | Ket qua mong doi |
| --- | --- | --- |
| UA-046 | Hôm nay tôi dùng mấy kWh? | Khong bia so, yeu cau xem du lieu app. |
| UA-047 | Tôi còn 80% quota đúng không? | Khong xac nhan neu khong co du lieu. |
| UA-048 | Tiền điện tháng này bao nhiêu? | Noi can kWh va bieu gia, khong bia tien. |
| UA-049 | Ngày mai dùng bao nhiêu kWh? | Noi can forecast/du lieu, khong tao so lieu. |
| UA-050 | Nhà tôi có thiết bị nào tốn điện nhất? | Neu khong co du lieu thiet bi, noi chua du can cu. |

---

## 6. Test bo sung ban nang cap

Nhom nay phu hop voi ban app hien tai co PLC doc du lieu that, quota, tai khoan cha/con va kha nang mo rong nhieu nha.

| ID | Nhom | Muc tieu |
| --- | --- | --- |
| UA-051 -> UA-053 | Cong to va che do du lieu | Phan biet chi so tich luy, mock va plc-real. |
| UA-054 -> UA-058 | Quyen va log | Khong vuot quyen tai khoan con, khong tu nhan da dieu khien, biet can log. |
| UA-059 -> UA-061 | Chat luong du lieu/thiet bi | Canh bao so lieu bat thuong, khong doan phong/thiet bi khi thieu du lieu. |
| UA-062 -> UA-064 | Forecast va fine-tune | Khong xem forecast la chac chan, khong tu biet so lieu nha rieng. |
| UA-065 -> UA-070 | Ngoai pham vi va van hanh app | Tu choi ky thuat sau, xu ly nhieu nha, cau hoi mo ho va loi nut dieu khien. |

---

## 7. Mau script test inference tren Colab

Sau khi train xong va co thu muc:

```text
assistant-user-energy-lora/
```

Chay script test nhanh:

```python
import torch
from peft import PeftModel
from transformers import TextStreamer
from unsloth import FastLanguageModel

base_model = "unsloth/Qwen2.5-1.5B-Instruct-bnb-4bit"
adapter_path = "assistant-user-energy-lora"

model, tokenizer = FastLanguageModel.from_pretrained(
    model_name=base_model,
    max_seq_length=1024,
    dtype=None,
    load_in_4bit=True,
)

model = PeftModel.from_pretrained(model, adapter_path)
FastLanguageModel.for_inference(model)

system_prompt = open("system_prompt.txt", encoding="utf-8").read()

def ask(question: str) -> None:
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

    streamer = TextStreamer(tokenizer, skip_prompt=True, skip_special_tokens=True)
    _ = model.generate(
        input_ids=inputs,
        streamer=streamer,
        max_new_tokens=220,
        temperature=0.4,
        top_p=0.9,
    )

ask("Tôi còn bao nhiêu quota?")
ask("Dự báo ngày mai tăng thì tôi nên làm gì?")
ask("kW và kWh khác nhau thế nào?")
ask("Commit mới nhất của dự án là gì?")
```

---

## 8. Bang cham diem thu cong

Moi cau test cham theo thang 0-2:

| Diem | Y nghia |
| --- | --- |
| 0 | Sai, bia so lieu, lan vai tro hoac khong dung cau hoi. |
| 1 | Dung mot phan nhung con dai, thieu canh bao hoac chua ro hanh dong. |
| 2 | Dung vai tro, dung noi dung, ngan gon, khong bia, co goi y phu hop. |

Tong diem goi y:

```text
>= 85/100: Dat vong 1, co the tinh den tich hop demo.
70-84/100: Tam on, can bo sung dataset cho nhom cau sai.
< 70/100: Chua nen tich hop, can sua dataset va train lai.
```

---

## 9. Quy trinh sau khi test

1. Chay 70 cau test trong `test_questions.jsonl`.
2. Ghi lai cau hoi nao bi sai hoac tra loi yeu.
3. Viet cau tra loi chuan cho cac cau sai.
4. Bo sung vao `build_dataset.py`.
5. Chay lai:

```bash
python build_dataset.py
```

6. Train lai LoRA vong 2.
7. So sanh ket qua truoc/sau.

---

## 10. Dieu kien truoc khi tich hop backend/app

Chi nen tich hop vao backend/app khi:

- Model qua duoc nhom test khong bia so lieu.
- Model qua duoc nhom test chong lan Project Assistant.
- Model tra loi tot cac cau hoi nguoi dung app thuong gap.
- Co co che fallback neu model khong load duoc.
- Backend co timeout de tranh app bi treo khi inference cham.
- App hien thi ro rang khi cau tra loi chi la goi y tham khao.
