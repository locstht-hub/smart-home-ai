from __future__ import annotations

import argparse
import re
import zipfile
from pathlib import Path

from docx import Document
from docx.oxml.ns import qn


EXPECTED_TITLE = (
    "THIẾT KẾ MÔ HÌNH GIÁM SÁT NĂNG LƯỢNG VÀ DỰ BÁO PHỤ TẢI "
    "CHO PHÒNG THÍ NGHIỆM ĐIỆN CÔNG NGHIỆP"
)


def cited_numbers(text: str) -> set[int]:
    numbers: set[int] = set()
    for match in re.finditer(r"\[(\d{1,2})\](?:\s*[-–]\s*\[(\d{1,2})\])?", text):
        start = int(match.group(1))
        end = int(match.group(2) or start)
        assert start <= end, match.group(0)
        numbers.update(range(start, end + 1))
    return numbers


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("docx", type=Path)
    parser.add_argument("--template", type=Path, required=True)
    args = parser.parse_args()

    document = Document(args.docx)
    template = Document(args.template)
    paragraphs = [paragraph.text.strip() for paragraph in document.paragraphs]
    full_text = "\n".join(paragraphs)

    title = paragraphs[0]
    assert title == EXPECTED_TITLE, title
    assert len(title.split()) == 20, len(title.split())
    assert len(document.sections) == len(template.sections) == 1
    for attribute in (
        "page_width",
        "page_height",
        "top_margin",
        "right_margin",
        "bottom_margin",
        "left_margin",
    ):
        assert getattr(document.sections[0], attribute) == getattr(template.sections[0], attribute), attribute

    assert len(document.inline_shapes) == 3, len(document.inline_shapes)
    assert len(document.tables) == 6, len(document.tables)
    assert len(re.findall(r"^Hình \d+\.", full_text, flags=re.MULTILINE)) == 3
    assert len(re.findall(r"^Bảng \d+\.", full_text, flags=re.MULTILINE)) == 4

    references_index = paragraphs.index("Tài liệu tham khảo")
    article_text = "\n".join(paragraphs[:references_index])
    citations = cited_numbers(article_text)
    assert citations == set(range(1, 19)), sorted(citations)

    references = [text for text in paragraphs[references_index + 1 :] if re.match(r"^\[\d+\]", text)]
    reference_numbers = [int(re.match(r"^\[(\d+)\]", item).group(1)) for item in references]
    assert reference_numbers == list(range(1, 19)), reference_numbers
    for doi in (
        "10.1109/ACCESS.2018.2831917",
        "10.3390/electronics12214453",
        "10.1016/j.jclepro.2021.129246",
        "10.1186/s42162-022-00212-9",
        "10.24432/C58K54",
        "10.1080/23311916.2024.2390674",
        "10.1038/s41598-025-91767-6",
        "10.1016/j.compeleceng.2025.110926",
        "10.3389/fenrg.2021.772027",
    ):
        assert doi in full_text, doi

    for forbidden in (
        "BẢN THẢO LÀM VIỆC",
        "tự động sa thải tải đã",
        "độ trễ PLC thực nghiệm là",
        "độ chính xác tại Cần Thơ đạt",
        "�",
        "Ã¡",
        "Ä‘",
        "Æ°",
        "áº",
        "á»",
    ):
        assert forbidden.lower() not in full_text.lower(), forbidden
    assert "không chứng minh XGBoost vượt trội có ý nghĩa thống kê" in full_text
    assert "Sa thải phụ tải chủ động được giữ ở trạng thái thiết kế" in full_text
    assert "không có biến thời tiết" in full_text

    for table in document.tables[2:]:
        layout = table._tbl.tblPr.find(qn("w:tblLayout"))
        assert layout is not None and layout.get(qn("w:type")) == "fixed"
        header = table.rows[0]._tr.get_or_add_trPr().find(qn("w:tblHeader"))
        assert header is not None
        widths = [int(col.get(qn("w:w"))) for col in table._tbl.tblGrid.gridCol_lst]
        assert widths and all(width > 0 for width in widths), widths

    with zipfile.ZipFile(args.docx) as archive:
        assert archive.testzip() is None
        media = [name for name in archive.namelist() if name.startswith("word/media/")]
        assert len(media) == 3, media
        xml = archive.read("word/document.xml").decode("utf-8")
        descriptions = re.findall(r'<wp:docPr[^>]*\bdescr="([^"]+)"', xml)
        assert len(descriptions) == 3 and all(value.strip() for value in descriptions), descriptions

    placeholders = sorted(set(re.findall(r"\[[^\]]*(?:TÁC GIẢ|ĐƠN VỊ|EMAIL|CƠ QUAN|KINH PHÍ)[^\]]*\]", full_text)))
    print("VALID")
    print(f"title_words={len(title.split())}")
    print(f"sections={len(document.sections)} tables=4 figures={len(document.inline_shapes)}")
    print(f"citations=1-18 references={len(references)}")
    print("package_integrity=ok geometry_matches_template=yes alt_text=ok table_headers=ok")
    print(f"author_placeholders={len(placeholders)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
