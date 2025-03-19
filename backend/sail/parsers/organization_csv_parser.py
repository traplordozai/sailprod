# backend/sail/parsers/organization_csv_parser.py
import pandas as pd
from typing import Dict, List, Any, Optional, Tuple
from django.db import transaction

from .base import CSVParser
from ..models import OrganizationProfile, AreaOfLaw

class OrganizationCSVParser(CSVParser):
    """Parser for organization data from CSV files"""

    def __init__(self, file_path: str, imported_by: str = None):
        super().__init__(file_path, 'csv', imported_by)

        # Define column patterns to search for
        self.column_patterns = {
            'name': ['name', 'organization name', 'org name'],
            'description': ['description', 'about', 'overview'],
            'areas_of_law': ['areas of law', 'practice areas', 'legal areas'],
            'location': ['location', 'address', 'city'],
            'email': ['email', 'contact email'],
            'phone': ['phone', 'phone number', 'contact phone'],
            'website': ['website', 'url', 'site'],
            'requirements': ['requirements', 'prerequisites', 'qualifications'],
            'positions': ['positions', 'available positions', 'openings'],
            'is_active': ['active', 'is active', 'status']
        }

    def parse(self) -> Tuple[List[OrganizationProfile], List[Dict]]:
        """
        Parse the CSV file and create/update organization records

        Returns:
            Tuple containing:
                - List of created/updated OrganizationProfile objects
                - List of error dictionaries
        """
        df = self.read_csv()
        if df.empty:
            return [], self.errors

        # Get column mappings
        column_map = self.get_column_map(df, self.column_patterns)

        # Ensure required columns exist
        if 'name' not in column_map:
            self.log_error("Missing required column: 'name'")
            return [], self.errors

        # Process each row
        created_or_updated = []

        for index, row in df.iterrows():
            try:
                with transaction.atomic():
                    # Extract name with safeguards
                    org_name = str(row[column_map['name']])

                    # Skip empty rows
                    if pd.isna(org_name) or org_name.strip() == '':
                        continue

                    # Get or create organization
                    org, created = OrganizationProfile.objects.get_or_create(
                        name=org_name
                    )

                    # Update fields
                    if 'description' in column_map and not pd.isna(row[column_map['description']]):
                        org.description = str(row[column_map['description']])

                    if 'location' in column_map and not pd.isna(row[column_map['location']]):
                        org.location = str(row[column_map['location']])

                    # Handle email with validation
                    if 'email' in column_map and not pd.isna(row[column_map['email']]):
                        email = str(row[column_map['email']])
                        if not self.validate_email(email):
                            self.log_error(
                                f"Invalid email format: {email}",
                                index,
                                {"organization": org_name}
                            )
                        else:
                            org.email = email

                    # Handle other fields
                    for field, column in [
                        ('phone', 'phone'),
                        ('website', 'website'),
                        ('requirements', 'requirements'),
                    ]:
                        if column in column_map and not pd.isna(row[column_map[column]]):
                            setattr(org, field, str(row[column_map[column]]))

                    # Handle positions as integer
                    if 'positions' in column_map and not pd.isna(row[column_map['positions']]):
                        try:
                            positions = int(row[column_map['positions']])
                            org.available_positions = positions
                        except ValueError:
                            self.log_error(
                                f"Invalid positions value: {row[column_map['positions']]}",
                                index,
                                {"organization": org_name}
                            )

                    # Handle is_active as boolean
                    if 'is_active' in column_map and not pd.isna(row[column_map['is_active']]):
                        value = str(row[column_map['is_active']]).lower()
                        org.is_active = value in ['true', 'yes', 'y', '1', 'active']

                    # Save organization first
                    org.save()

                    # Handle areas of law
                    if 'areas_of_law' in column_map and not pd.isna(row[column_map['areas_of_law']]):
                        areas_text = str(row[column_map['areas_of_law']])
                        area_names = [area.strip() for area in areas_text.split(';') if area.strip()]

                        # Clear existing areas and add new ones
                        org.areas_of_law.clear()
                        for area_name in area_names:
                            area, _ = AreaOfLaw.objects.get_or_create(name=area_name)
                            org.areas_of_law.add(area)

                    created_or_updated.append(org)
                    self.success_count += 1

            except Exception as e:
                self.log_error(f"Error processing row {index}: {str(e)}", index, {"row": row.to_dict()})

        # Create import log
        self.create_import_log()

        return created_or_updated, self.errors