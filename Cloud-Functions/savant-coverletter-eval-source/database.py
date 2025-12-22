from pymongo import MongoClient
from typing import List, Dict, Optional, Tuple

class DatabaseManager:
    def __init__(self, mongo_uri: str):
        self.client = MongoClient(mongo_uri)
        self.db = self.client.savantmongodb
        self.interviews = self.db.interviews
        self.eval_db = self.db.evaltrees
        self.jd_collection = self.db.OpenAIPrompts
        self.crd_eval_db = self.db.CRD_eval_db

    def get_interview_details(self, uuid: str) -> Tuple[Optional[str], Optional[str], Optional[str]]:
        try:
            interview = self.interviews.find_one({"uuid": uuid})
            if not interview:
                return None, None, None

            drive_details = self.jd_collection.find_one({'name': interview["interview_drive"]})
            if not drive_details:
                return None, None, None

            drive = self._format_drive_details(drive_details)
            return interview["chatlog"], drive, interview['candidate_id']
        except Exception as e:
            logging.error(f"Database error: {str(e)}")
            return None, None, None

    def get_cover_letter(self, uuid: str) -> Optional[str]:
        try:
            interview = self.interviews.find_one({"uuid": uuid})
            if not interview:
                return None
                
            return interview["covertext"]
        except Exception as e:
            logging.error(f"Database error: {str(e)}")
            return None

    def fetch_drive(self, drive_name: str) -> Optional[str]:
        """
        Fetch a specific drive details by name
        Args:
            drive_name: Name of the drive to fetch
        Returns:
            Formatted drive details string or None if not found
        """
        try:
            drive_details = self.jd_collection.find_one({'name': drive_name})
            if not drive_details:
                logging.error(f"Drive not found: {drive_name}")
                return None
                
            return self._format_drive_details(drive_details)
        except Exception as e:
            logging.error(f"Error fetching drive {drive_name}: {str(e)}")
            return None
        
    @staticmethod
    def _format_drive_details(drive_details: Dict) -> str:
        return f"""
        Name: {drive_details['name']}
        Required Skills: {drive_details['skills']}
        Roles and Responsibilities: {drive_details['sections']}
        Question Expectancy: {drive_details['question_pattern']}
        """

    def update_interview_transcript(self, 
                                  uuid: str, 
                                  candidate_id: str, 
                                  extended_transcript: str,
                                  qna_pairs: List[Tuple[str, str]]) -> bool:
        """Update interview with extended transcript"""
        try:
            update_result = self.interviews.update_one(
                {"uuid": uuid, "candidate_id": candidate_id},
                {
                    "$set": {
                        "extended_chatlog": extended_transcript,
                        "extension_qa_pairs": qna_pairs,
                        "last_extended": datetime.utcnow()
                    }
                }
            )
            return update_result.modified_count > 0
        except Exception as e:
            logging.error(f"Error updating transcript: {str(e)}")
            return False
