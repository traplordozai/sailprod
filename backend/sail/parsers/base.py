# backend/sail/parsers/base.py
import pandas as pd
import logging
from typing import List, Dict, Any, Tuple, Optional
from ..models import ImportLog

logger = logging.getLogger(__name__)

class BaseParser:
    """Base parser with common functionality for all import types"""

    def __init__(self, file_path: str, import_type: str, imported_by: str = None):
        self.file_path = file_path
        self.file_name = file_path.split('/')[-1]
        self.import_type = import_type
        self.imported_by = imported_by
        self.success_count = 0
        self.error_count = 0
        self.errors = []

    def log_error(self, message: str, row_index: int = None, data: Dict = None):
        """Log an error during parsing"""
        error = {
            'message': message,
            'row_index': row_index,
            'data': data
        }
        self.errors.append(error)
        self.error_count += 1
        logger.error(f"Import error: {message}")

    def create_import_log(self) -> ImportLog:
        """Create an import log entry"""
        import json
        log = ImportLog(
            file_name=self.file_name,
            import_type=self.import_type,
            imported_by=self.imported_by,
            success_count=self.success_count,
            error_count=self.error_count,
            errors=json.dumps(self.errors)
        )
        log.save()
        return log

    def validate_email(self, email: str) -> bool:
        """Validate email format"""
        if not email:
            return True  # Empty emails are allowed

        import re
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return bool(re.match(pattern, email))


class CSVParser(BaseParser):
    """Base CSV parser with common CSV functionality"""

    def __init__(self, file_path: str, import_type: str, imported_by: str = None):
        super().__init__(file_path, import_type, imported_by)

    def read_csv(self) -> pd.DataFrame:
        """Read a CSV file into a DataFrame with flexible handling"""
        try:
            # Try different encodings and delimiters for robustness
            df = pd.read_csv(self.file_path, encoding='utf-8')
            return df
        except UnicodeDecodeError:
            try:
                df = pd.read_csv(self.file_path, encoding='latin1')
                return df
            except Exception as e:
                self.log_error(f"Failed to read CSV: {str(e)}")
                return pd.DataFrame()
        except Exception as e:
            self.log_error(f"Failed to read CSV: {str(e)}")
            return pd.DataFrame()

    def get_column_map(self, df: pd.DataFrame, column_patterns: Dict[str, List[str]]) -> Dict[str, str]:
        """
        Map expected columns to actual CSV columns based on patterns

        Args:
            df: DataFrame with the CSV data
            column_patterns: Dict mapping internal names to possible column name patterns

        Returns:
            Dict mapping internal names to actual column names in the CSV
        """
        column_map = {}

        for internal_name, possible_names in column_patterns.items():
            found = False
            for pattern in possible_names:
                matches = [col for col in df.columns if pattern.lower() in col.lower()]
                if matches:
                    column_map[internal_name] = matches[0]
                    found = True
                    break

            if not found:
                self.log_error(f"Could not find column for {internal_name}")

        return column_map