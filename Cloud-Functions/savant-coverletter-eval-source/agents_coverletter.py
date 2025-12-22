import json
from typing import List

class DebateAgent:
    def __init__(self, name: str, system_message: str, api_client):
        self.name = name
        self.system_message = system_message
        self.api_client = api_client

    def generate_response(self, context: str) -> str:
        messages = [{"role": "user", "content": context}]
        return self.api_client.claude(messages, self.system_message)

class CourtroomDebate:
    def __init__(self, api_client, cover_letter: str, drive: str):
        self.api_client = api_client
        self.cover_letter = cover_letter
        self.drive = drive
        self.setup_agents()

    def setup_agents(self):
        self.defense = DebateAgent(
            name="Defense",
            system_message=self._get_defense_prompt(),
            api_client=self.api_client
        )
        self.prosecutor = DebateAgent(
            name="Prosecutor",
            system_message=self._get_prosecutor_prompt(),
            api_client=self.api_client
        )
        self.judge = DebateAgent(
            name="Judge",
            system_message=self._get_judge_prompt(),
            api_client=self.api_client
        )

    def conduct_debate(self) -> str:
        """Run a debate session"""
        transcript = ["The Court is now in Session."]
        max_rounds = 5
        
        try:
            for _ in range(max_rounds):
                for agent in [self.defense, self.prosecutor]:
                    argument = agent.generate_response("\n".join(transcript))
                    transcript.append(f"{agent.name}: {argument}")
                
                evaluation = self.judge.generate_response("\n".join(transcript))
                transcript.append(f"Judge: {evaluation}")
                
                if "final_decision" in evaluation.lower():
                    break
            
            final_transcript = "\n".join(transcript)
            print("\nDebate completed. Final transcript snippet:")
            print(final_transcript[-200:]) # Print last 200 chars to see final decision
            return final_transcript
            
        except Exception as e:
            print(f"Error in debate: {str(e)}")
            raise


    def _get_defense_prompt(self) -> str:
        return f"""
You are an AI assistant roleplaying as a Cover Letter Advocate. Your role is to analyze how well the candidate's cover letter aligns with the job requirements and demonstrate why this application should move forward. Structure your arguments as follows:

1. Analyze (Pre-Turn):
   - Review any criticisms about the cover letter's content, style, or alignment with the role
   - Identify strong connections between the letter and job requirements
   - Assess how effectively the candidate has presented their qualifications

2. Respond (Your Turn):
   a) Opening Statement (First Turn Only):
      - Highlight key strengths of the cover letter's content and presentation
      - Show how the letter demonstrates understanding of the role
      - Point out specific alignments between candidate's experience and job requirements

   b) Main Argument:
      - Defend how the letter effectively communicates candidate's value proposition
      - Provide examples of well-articulated skills and experiences
      - Show how the writing style and tone are appropriate for the role

   c) Counter-Criticism:
      - Address any concerns about missing elements or presentation
      - Explain how the letter's approach might actually be advantageous
      - Demonstrate how any perceived weaknesses are outweighed by strengths

Key Focus Areas:
- Writing quality and professionalism
- Alignment between stated experience and job requirements
- Evidence of research and understanding of the role/company
- Effectiveness in communicating relevant skills and achievements
- Appropriate tone and presentation

Candidate's Cover Letter:  
```{self.cover_letter}```

Job Description:
```{self.drive}```
        """

    def _get_prosecutor_prompt(self) -> str:
        return f"""
You are an AI assistant roleplaying as a Cover Letter Critic. Your role is to critically evaluate whether the cover letter meets professional standards and effectively addresses job requirements. Structure your analysis as follows:

1. Analyze (Pre-Turn):
   - Identify gaps between the cover letter content and job requirements
   - Note any missing key qualifications or experiences
   - Assess writing quality, tone, and presentation issues

2. Respond (Your Turn):
   a) Opening Statement (First Turn Only):
      - Present key concerns about the cover letter's effectiveness
      - Highlight critical missing elements or misalignments
      - Address any significant presentation or writing issues

   b) Main Criticism:
      - Point out specific shortcomings in addressing job requirements
      - Highlight gaps in demonstrated qualifications
      - Identify issues with writing quality, tone, or professionalism

   c) Counter Arguments:
      - Challenge effectiveness of stated qualifications
      - Question relevance of presented experiences
      - Address any potential misrepresentation or unclear statements

Key Focus Areas:
- Missing or inadequately addressed job requirements
- Writing quality and professional standards
- Clarity and specificity of examples
- Appropriateness of tone and format
- Evidence of customization for the role

Candidate's Cover Letter:  
```{self.cover_letter}```

Job Description:
```{self.drive}```
        """

    def _get_judge_prompt(self) -> str:
        return f"""
You are an AI assistant roleplaying as an impartial Cover Letter Evaluator. Your role is to determine if the cover letter warrants moving forward in the hiring process. Follow this evaluation framework:

1. Assessment Criteria:
   - Writing quality and professionalism
   - Alignment with job requirements
   - Clarity and effectiveness of communication
   - Evidence of role-specific customization
   - Overall presentation and impact

2. Evaluation Process:
   - Review arguments from both Advocate and Critic
   - Compare letter content against job requirements
   - Assess writing quality and professional standards
   - Evaluate effectiveness in communicating qualifications
   - Consider overall impression and potential fit

3. Decision Making:
   - Weigh strengths against weaknesses
   - Consider industry and role-specific standards
   - Evaluate against typical cover letter expectations
   - Assess potential for candidate success based on presentation

Final Decision Format:
```
{{"final_decision": "Accept" or "Reject",
  "reason": "Brief explanation of decision"}}
```

Key Considerations:
- Does the letter effectively communicate relevant qualifications?
- Is the writing professional and error-free?
- Does content align well with job requirements?
- Is there evidence of genuine interest and research?
- Would this letter stand out positively in a pool of candidates?

Aceppt: The cover letter is aligned with the JOB Description
Reject: The cover letter is not aligned with the JOB Description.
Cover Letter:  
```{self.cover_letter}```

Job Description:
```{self.drive}```


YOUR FINAL DECISION MUST BE IN THE EXACT FORMAT:
Judge's Assessment: [Your assessment text here]
FINAL DECISION: {{"final_decision": "Accept"}} or {{"final_decision": "Reject"}}

Do not include any other text after the FINAL DECISION line.
        """