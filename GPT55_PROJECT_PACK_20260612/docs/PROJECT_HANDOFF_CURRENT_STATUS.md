# PROJECT HANDOFF CURRENT STATUS

**Ngay dung tam:** 26/05/2026  
**Repo:** `https://github.com/locstht-hub/smart-home-ai.git`  
**Nhanh:** `main`

## 1. Trang thai chung

Du an tam dung o moc:

- Phan mem smart home/app/backend/forecast da co nen tang chinh.
- Website gioi thieu va trang tien do da deploy qua Cloudflare Pages/GitHub integration.
- Backend endpoint da du cho mobile app va admin site hien tai.
- User Energy Assistant da train thu bang Unsloth va da test vong 1.
- AI Assistant tam gac, chua tich hop vao app/backend.
- Bai bao khoa hoc tam gac, chua uu tien viet luc nay.
- Uu tien tiep theo la phan cung/thuc nghiem/du lieu that.

## 2. Cac viec da lam gan day

### Website/project site

- Them trang tien do chi tiet: `project-site/progress.html`
- Them CSS rieng: `project-site/progress.css`
- Gan link `Tien do` vao `project-site/index.html`
- Them khoi `Tom tat du an` vao trang chu.
- Cloudflare Pages dang auto deploy tu GitHub.
- Domain xem web: `https://smarthomeai.id.vn/`
- Trang tien do: `https://smarthomeai.id.vn/progress`

### Tai lieu tien do

- Tao file tom tat tien do Markdown:
  - `TOM_TAT_TIEN_DO_DU_AN_SMART_HOME_AI.md`
- Tao file audit backend endpoint:
  - `BACKEND_ENDPOINT_AUDIT.md`
- Cap nhat README backend:
  - `backend/smart_home_server/README.md`

### Backend endpoint audit

Ket luan: backend hien tai co du endpoint ma app/admin dang goi.

Backend chinh:

- `backend/smart_home_server/app.py`
- Co auth, system status, power, devices, scenes, assistant, quota, members, admin.

Forecast API:

- `backend/forecast_api/app.py`
- Co `model-info`, `sample`, `predictions`, `insights`, `anomalies`, `model-compare`, `trigger-retrain`.

PLC Gateway:

- `backend/plc_gateway/power_api.py`
- Chi la gateway toi gian doc `/api/power/current`, khong thay backend chinh.

Luu y:

- `/api/assistant/chat` hien la rule/intent fallback, chua dung LoRA.
- `/forecast/trigger-retrain` la POC/gia lap, chua phai auto retrain production.

### Project Assistant dataset

Thu muc:

```text
ml-training/assistant-project-qa/
```

Da co:

- `train.jsonl`: 200 mau train
- `eval.jsonl`: 16 mau eval
- `system_prompt.txt`
- `requirements.txt`
- `train_unsloth_project_qa.py`

Muc tieu: tro ly hoi dap ve du an, kien truc, bai bao, GitHub, Cloudflare, backend, forecast, trang thai prototype.

Trang thai: da chuan bi dataset va script, chua uu tien train tiep.

### User Energy Assistant dataset va train

Thu muc:

```text
ml-training/assistant-user-energy-qa/
```

Da co:

- `train.jsonl`: 220 mau train
- `eval.jsonl`: 20 mau eval
- `system_prompt.txt`
- `requirements.txt`
- `build_dataset.py`
- `train_unsloth_user_energy.py`
- `TEST_PLAN.md`
- `test_questions.jsonl`
- `run_lora_eval.py`
- `score_lora_eval.py`

Da train thanh cong tren Colab:

- Base model: `unsloth/Qwen2.5-1.5B-Instruct-bnb-4bit`
- Output adapter: `assistant-user-energy-lora`
- Adapter da tai ve may tai:

```text
C:\Users\ADMIN\Downloads\assistant-user-energy-lora
```

Ket qua train:

- 4 epochs
- Final eval loss khoang `0.2911`
- Train runtime khoang 4 phut tren Tesla T4

Ket qua test vong 1:

- Automated score: `98/100 PASS`
- Manual review: chua dat de tich hop app/backend.

Loi manual review can sua neu quay lai AI Assistant:

- Con tra loi ve bai bao/Cloudflare/GitHub trong mot so cau, sai vai tro User Assistant.
- Co luc bia/nhan dinh UI step xoa du lieu.
- Co luc xac nhan quota 80% qua yeu.
- Co luc doan thiet bi ton dien khi khong co du lieu thiet bi.
- Co luc noi du lieu am "co the hop ly" chua chat.

Ket luan:

```text
Train ky thuat: dat
Hanh vi de tich hop app: chua dat
Can vong 2 hard-negative samples neu tiep tuc AI Assistant
```

## 3. Quyet dinh hien tai

Tam gac:

- AI Assistant/Unsloth integration.
- Bai bao khoa hoc.
- Fine-tune vong 2.

Uu tien tiep:

1. Hoan thien phan cung/thuc nghiem.
2. Lay du lieu that.
3. Kiem tra app/backend doc va hien thi dung du lieu.
4. Kiem tra Forecast API voi du lieu that.
5. Sau do moi quay lai AI Assistant hoac bai bao.

## 4. Cac commit moc gan day

- `9364b2a Add backend endpoint audit`
- `7713f3b Add automated user assistant evaluation`
- `d461c2b Add user energy assistant test plan`
- `27e4dc7 Update Unsloth trainers for latest TRL`
- `ce85ad6 Add user energy assistant dataset`
- `1dc6564 Expand project QA dataset to 200 samples`
- `93ac192 Add Unsloth project QA dataset`
- `1aecd86 Update progress page deployment status`
- `1d4ad31 Add project summary to site homepage`
- `a22c0d9 Add project progress summary page`

## 5. Khi mo lai phien sau

Nen bat dau bang:

```text
Doc PROJECT_HANDOFF_CURRENT_STATUS.md
Doc BACKEND_ENDPOINT_AUDIT.md
Kiem tra git status
Sau do tiep tuc theo huong phan cung/thuc nghiem
```

Neu quay lai AI Assistant:

1. Bo sung hard-negative samples vao `ml-training/assistant-user-energy-qa/build_dataset.py`.
2. Sinh lai dataset.
3. Train lai LoRA vong 2.
4. Chay `run_lora_eval.py`.
5. Cham bang `score_lora_eval.py` va doc manual 50 cau.


