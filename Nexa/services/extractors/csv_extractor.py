# extractors/csv_extractor.py
import csv
from .base_extractor import BaseExtractor


class CSVExtractor(BaseExtractor):
    def extract_text(self) -> str:
        """
        Extract text from a CSV file without relying on heavy third-party
        dependencies like pandas. This keeps the backend lightweight and avoids
        native extension issues on some platforms.
        """
        lines = []
        try:
            with open(self.file_path, "r", encoding="utf-8", errors="ignore", newline="") as csv_file:
                reader = csv.reader(csv_file)
                for row in reader:
                    # Join columns with a separator to maintain readability
                    normalized = [str(cell).strip() for cell in row]
                    lines.append(" | ".join(normalized))
        except FileNotFoundError:
            return ""
        except Exception as exc:
            # Capture any parsing issues and still return what we managed to read
            lines.append(f"[CSV parsing error: {exc}]")

        return "\n".join(lines).strip()
