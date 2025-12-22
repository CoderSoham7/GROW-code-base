import React, { useState, useEffect, useContext } from "react"
import { Row, Col, Card, Container, Collapse, Alert, Spinner, Table } from "react-bootstrap"
import { useDispatch, useSelector } from "react-redux"
import Form from "react-bootstrap/Form"
import Button from "react-bootstrap/Button"
import { multiJDUpload, getAllJD } from "../Actions/UserActions.js"
import { useNavigate, Link } from "react-router-dom"
import Message from "../Components/Message.js"
import Loader from "../Components/Loader.js"
import swal from 'sweetalert';  
import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons'  
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome" 
import { AuthContext } from "./AuthContext.js"

const UploadJDScreen = () => {
  const { userInfo, loading, error } = useContext(AuthContext); 

  const [excelFile, setExcelFile] = useState(false)
  const [excelData, setExcelData] = useState(null);
  const [showAlert, setShowAlert] = useState(false);
  const Navigate = useNavigate()
  const dispatch = useDispatch()
  
  useEffect(() => {  
    if (!userInfo) {  
      Navigate("/")  
    }  
    dispatch(getAllJD(userInfo));  
  }, [Navigate, userInfo, dispatch]);

  const allJD = useSelector(state => state.getAllJD.jdlist);
  const submitHandler = async (e) => {
    e.preventDefault()   
    try {  
      dispatch(multiJDUpload(userInfo._id, excelData, userInfo))  
      .then(() => {   
      swal({  
        title: "Interview skills uploaded",  
        icon: "success",  
      });  
    })  
    .catch(() => {   
      swal({  
        title: "Upload failed",  
        icon: "error",  
      });  
    }); 
    } 
    
    catch (error) {  
      swal({  
        title: "Upload failed",  
        icon: "error",  
      });
    }  

    if (excelFile !== null) {  
      setExcelData(null);  
      document.getElementById("fileInput").value = "";  
    }
  }

  const JDUploadHandler = async (e) => {    
    const file = e.target.files[0];    
    const allowedTypes = [    
      'application/vnd.ms-excel',    
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',    
      'text/csv'    
    ];   
       
    if (file && allowedTypes.includes(file.type)) {    
      const workbook = new ExcelJS.Workbook();    
      const reader = new FileReader();    
      reader.onload = async (e) => {    
        try {  
          const arrayBuffer = e.target.result;    
          await workbook.xlsx.load(arrayBuffer);    
          const worksheet = workbook.getWorksheet(1);  
          const data = [];    
          worksheet.eachRow((row, rowNumber) => {  
            if (rowNumber > 1) {    
              const rowData = {};    
              row.eachCell({ includeEmpty: true }, (cell, colNumber) => {  
                const key = worksheet.getRow(1).getCell(colNumber).value;    
                let cellValue = cell.value;  
                   
                if (cellValue && typeof cellValue === 'object') {  
                  if (cellValue.richText) { 
                    rowData[key] = cellValue.richText.map(part => part.text).join('');  
                  } else {  
                    rowData[key] = JSON.stringify(cellValue);  
                  }  
                } else {  
                  rowData[key] = cellValue;  
                }  
              });    
              data.push(rowData);    
            }    
          });    
          setExcelData(data);    
        } catch (error) {  
          console.error("Error loading Excel file:", error);  
          swal({  
            title: "Error loading file",  
            text: "There was an error processing the Excel file.",  
            icon: "error",  
          });  
        }  
      };  
      reader.onerror = (error) => {  
        console.error("FileReader error:", error);  
        swal({  
          title: "File Read Error",  
          text: "There was an error reading the file.",  
          icon: "error",  
        });  
      };  
      reader.readAsArrayBuffer(file);    
    } else {    
      swal({  
        title: "Invalid file type",  
        text: "Please upload a csv/xls/xlsx file only.",  
        icon: "error",  
      });  
      e.target.value = null;    
    }    
  }; 
  
  const triggerDownload = (buffer, filename) => {    
    const blob = new Blob([buffer], {    
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'    
    });    
    const url = window.URL.createObjectURL(blob);    
    const anchor = document.createElement('a');    
    anchor.href = url;    
    anchor.download = filename;    
    document.body.appendChild(anchor);
    anchor.click();    
    document.body.removeChild(anchor);
    setTimeout(() => window.URL.revokeObjectURL(url), 100);    
  };  
  
  const headerFont = {  
    bold: true 
  };    
  const alignmentWrapText = {  
    vertical: 'top',  
    horizontal: 'left',  
    wrapText: true  
  };      

  const downloadExcelTemplate = () => {
    const workbook = new ExcelJS.Workbook(); 
    const templateData = [
      {
        "skill_level": "Jr ML Engineer (PL1)",
        "difficulty": "(Ask EASY complexity questions)",
        "skill_list": "1. A Bachelor's degree in Computer Science, Statistics, Mathematics, or a related field is mandatory, with a preference for candidates holding advanced degrees. Experience in AI/ML projects, internships, or relevant publications can provide an edge.\n2. Deep expertise and comprehension of generative AI models, especially GANs and VAEs, is essential.\n3. Proficiency in Python and thorough understanding of machine learning frameworks such as TensorFlow, PyTorch, or Keras is required.\n4. An in-depth understanding of machine learning theories, principles, and algorithms is a must.\n5. Exceptional problem-solving skills, outstanding analytical abilities, and meticulous attention to detail are pivotal.\n6. Strong communication skills, including the ability to elucidate complex AI concepts to non-technical stakeholders in a comprehensible manner, are needed.\n7. Robust teamwork skills and the aptitude to collaborate productively on projects within a diverse team are necessary.\n8. Familiarity with SQL and NoSQL databases, as well as an understanding of data structures and algorithms, provide added value.\n9. Prior experience or familiarity with cloud platforms such as AWS, Google Cloud, or Azure is preferred.\n10. Demonstrated interest or experience in NLP and reinforcement learning is highly desirable.\n11. The ability to analyze large data sets to extract valuable insights, and monitor model performance and data accuracy is crucial.\n12. A proven track record in AI/ML projects, internships, or publications is beneficial.",
        "responsibilities": "[Ask 20 questions]\n`-- Actively engage in the design, development, and execution of generative AI models, specifically focusing on GANs and VAEs.\n`-- Stay abreast of the latest advancements, trends, and technologies in AI and ML, incorporating these insights into our business solutions to drive innovation.\n`-- Work closely with cross-functional teams to optimize and streamline the processes involved in model development and deployment.\n`-- Analyze vast datasets to extract valuable insights that can be used to enhance and optimize our algorithms and models.\n`-- Regularly monitor and evaluate the performance and accuracy of AI models and data, implementing necessary adjustments and improvements to ensure optimal results.\n`-- Clearly articulate complex AI and ML concepts to non-technical stakeholders, promoting understanding and knowledge sharing.\n`-- Contribute actively to research and development initiatives, aiding in the creation and refinement of machine learning algorithms and models.\n`-- Proactively identify potential areas for AI application and improvement within the organization, fostering a culture of innovation and growth.\n`-- Uphold the company's standards of excellence in all tasks and projects, maintaining a high level of professionalism and work ethic.\n`-- Encourage a collaborative and innovative work environment, contributing to team efforts, supporting colleagues, and ensuring the successful completion of projects.\n`-- Commit to continuous learning and development in AI, ML, and related fields, keeping up-to-date with industry trends, new technologies, and best practices to enhance the company's AI capabilities and drive innovation.",
        "interview_style": "The given set of questions are technical and straightforward, designed to evaluate the candidate's specific knowledge and comprehension of diverse concepts in Data Science and AIML. These questions are concentrated on the candidate's familiarity with the terminology, concepts, and operations unique to Data Science and AIML. It requires the candidate to demonstrate in-depth knowledge, practical experience, problem-solving skills, a commitment to continuous learning, technical proficiency, and specific domain knowledge.\n",
        "industry_benchmark":"The bot should ask 2 questions to be at the proficiency level of a Kaggle Grandmaster."
      },
      {
        "skill_level": "Data Scientist (PL2)",
        "difficulty": "(Ask MEDIUM complexity questions)",
        "skill_list": "1. A Bachelor's, Master's degree, or Ph.D. in Computer Science, Statistics, Mathematics, or a related field is required.\n2. Demonstrated experience as a Machine Learning Engineer, Data Scientist, or a similar role is mandatory. \n3. Proficiency in Python and familiarity with machine learning frameworks such as TensorFlow, PyTorch, or Keras is expected.\n4. Extensive experience in designing, developing, and deploying generative AI models, particularly GANs and VAEs, is crucial.\n5. A strong understanding of machine learning theories and principles is essential.\n6. Excellent problem-solving skills, attention to detail, and analytical abilities are required.\n7. Strong communication and teamwork skills, with the ability to communicate complex AI concepts to non-technical stakeholders, is important.\n8. Ability to work with cross-functional teams to establish model development and deployment pipelines is desirable.\n9. Proven ability to monitor AI model performance and data accuracy, and implement improvements as needed is necessary.\n10. Familiarity with SQL and NoSQL databases and experience with cloud platforms such as AWS, Google Cloud, or Azure is preferred.\n11. Experience in analyzing large data sets and extracting valuable insights is vital.\n12. Up-to-date knowledge of the latest advancements in AI and ML technologies and the capability to implement them is beneficial.\n13. Experience with NLP and reinforcement learning is advantageous.\n14. Publications in AI/ML conferences or journals would be a plus.\n15. The ability to stay abreast with the rapid advancements in the AI and ML field is expected.",
        "responsibilities": "[Ask 20 questions]\n`-- Design, develop and deploy advanced generative AI models, focusing heavily on GANs and VAEs, while continually refining them as per latest advancements in AI and ML technologies.\n`-- Collaborate with cross-functional teams to streamline the efficient development and deployment of AI models, ensuring their reliability and relevance.\n`-- Analyze large, complex datasets to extract valuable insights that can be used to optimize and refine AI algorithms and machine learning models.\n`-- Consistently monitor the performance and accuracy of AI models, implementing improvements as necessary to ensure optimal performance and reliability.\n`-- Effectively communicate intricate AI concepts and findings to both technical and non-technical stakeholders, ensuring they understand the value and impact of the work.\n`-- Drive innovation within the company by enhancing AI capabilities, integrating AI models into existing systems and processes, and developing robust machine learning algorithms.\n`-- Stay informed about industry trends and advancements in AI and ML technologies to ensure the company's AI capabilities remain competitive.\n`-- Develop and implement strategic solutions to tackle business challenges using AI and ML technologies, regularly assessing their effectiveness.\n`-- Provide technical guidance and support to other team members, fostering a collaborative and learning environment.\n`-- Adhere to data privacy and security standards when handling sensitive information, ensuring trust and compliance.\n`-- Regularly review, adjust, and improve AI models to ensure their relevance, accuracy, and overall performance.\n`-- Actively participate in team meetings and brainstorming sessions to discuss AI projects and strategies, adding value to team dynamics.\n`-- Contribute to publications and presentations to share the company's AI initiatives and accomplishments with the broader community.",
        "interview_style": "This set of questions, crafted with more depth and based on real-world scenarios, aims to evaluate the candidate's theoretical knowledge as well as hands-on experience in various facets of Data Science and AIML. For an ML engineer, the questions are not just limited to their technical prowess. They are also designed to measure their ability to mentor junior data scientists effectively, and their competence to independently liaise with clients to understand and gather data science requirements. This comprehensive evaluation will provide insight into the candidate's technical skills, leadership capacity, and client management abilities, ensuring they are well-rounded in every aspect required for the role.\n",
        "industry_benchmark":"The bot should ask 4 questions to be at the proficiency level of a Kaggle Grandmaster and  a Cloud Solutions Architect."
      },
      {
        "skill_level": "AIML Architect (PL3)",
        "difficulty": "(Ask HARD complexity questions)",
        "skill_list": "1. Demonstrated exceptional expertise and professional experience in AI and machine learning, with a specific focus on Language Models (LLM) and Generative AI technologies. \n2. Proficiency in designing, developing, implementing, and maintaining advanced LLM systems across a range of applications.\n3. Proficient in programming languages like Python, Java, or similar, and knowledgeable in AI and machine learning platforms such as TensorFlow, PyTorch, as well as cloud platforms like AWS, GCP, or Azure.\n4. Strong analytical and problem-solving skills to analyze complex datasets for improving model performance, along with proficiency in validating and optimizing machine learning models for deployment and production purposes.\n5. Experience in creating and maintaining robust data pipelines for machine learning model training and deployment.\n6. Comprehensive understanding of data security, integrity, and confidentiality best practices, with strict adherence to data privacy regulations.\n7. Excellent collaboration skills, with demonstrated ability to effectively work with cross-functional teams, including data scientists, engineers, and product managers.\n8. Ability to communicate complex technical concepts effectively to both technical and non-technical stakeholders.\n9. Strong attention to detail and excellent documentation skills for accurately capturing processes, designs, and updates.\n10. Familiarity with Agile/Scrum development process and experience with publications in reputed AI or ML journals would be advantageous.\n11. A Master's degree or higher in a relevant field such as Computer Science, Artificial Intelligence, Machine Learning, Mathematics, Engineering, or a related field.\n12. Proven professional experience in AI/ML roles with a preference for experience as an LLM Architect.\n13. Commitment to staying current with the latest trends and advancements in generative AI, machine learning, and LLM technologies.\n14. Willingness to travel occasionally to client locations or conferences.\n15. Exceptional problem-solving skills, analytical abilities, and a detail-oriented mindset.\n",
        "responsibilities": "[Ask 20 questions]\n`-- Designing, developing, implementing, and maintaining advanced LLM systems for generative AI applications.\n`-- Collaborating with cross-functional teams to develop high-performance AI algorithms and predictive models.\n`-- Staying updated with the latest trends and advancements in generative AI, machine learning, and LLM technologies.\n`-- Building and maintaining robust data pipelines for machine learning model training and deployment.\n`-- Analyzing complex datasets to enhance model performance and ensure the robustness of the implemented models.\n`-- Validating and optimizing machine learning models for deployment and production use, while adhering to data security, integrity, and confidentiality standards.\n`-- Complying with data privacy regulations and best practices in all operations.\n`-- Documenting all processes, designs, and updates comprehensively for future reference and transparency.\n`-- Communicating complex technical concepts effectively to both technical and non-technical stakeholders.\n`-- Actively participating in team meetings, conferences, and professional development activities to share insights and stay abreast of the latest advancements.\n`-- Leading research and development activities to identify new opportunities for implementing LLM and generative AI technologies, and potentially publishing findings in recognized AI or ML journals.\n`-- Managing multiple projects simultaneously, efficiently prioritizing tasks based on deadlines and importance.\n`-- Regularly reviewing, troubleshooting, and improving existing systems and models for optimal performance.\n`-- Conducting regular system tests and performance checks to ensure high performance, security, and continual improvement of existing systems and models.\n`-- Mentoring and providing guidance to junior team members, helping them improve their skills and knowledge in AI and ML technologies.\n`-- Occasionally traveling to client locations or conferences for project execution and knowledge exchange.\n`-- Adhering to project timelines and resource allocation plans for efficient project management, while ensuring data security and confidentiality regulations are met.\n`-- Regularly delivering reports on system performance, progress, and the latest advancements in the field.\n`-- Participating in professional development activities to stay updated with the latest developments in the field.\n",
        "interview_style": "This meticulously curated set of questions is designed with a high level of specificity, focusing on the practical application of Data Science. For an Architect level candidate with LLM skill, these questions not only measure their technical comprehension, experience, and problem-solving abilities in Data Science and AIML, but also assess their capability to design GenAI-based applications' architecture from scratch, suitable for both cloud and on-premises platforms.\n",
        "industry_benchmark":"The bot should ask 8 questions to be at the proficiency level of a Kaggle Grandmaster and  a Cloud Solutions Architect."
  
      },
    ];

    const applyStylesToRow = (row, isHeader = false) => {  
      row.eachCell({ includeEmpty: true }, (cell) => {  
        cell.alignment = alignmentWrapText;  
        if (isHeader) {  
          cell.font = headerFont;  
        }  
      });  
    };  

    const worksheet = workbook.addWorksheet('Template');  
    worksheet.columns = Object.keys(templateData[0]).map(key => ({  
      header: key,  
      key: key,  
      width: 20,  
    }));    
    const headerRow = worksheet.getRow(1);  
    applyStylesToRow(headerRow, true);  

    templateData.forEach(item => {  
      const row = worksheet.addRow(item);  
      applyStylesToRow(row);  
    });  
  
    workbook.xlsx.writeBuffer().then((buffer) => {  
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });  
      triggerDownload(blob, 'Interview_Skill_Upload_Template.xlsx');  
    });  
  };  

  const templates = [
    
    {
      "skill_level": "skill_level: Jr ML Engineer (PL1)\n",
      "difficulty": "difficulty: (Ask EASY complexity questions)\n",
      "skill_list": "skill_list:\n1. A Bachelor's degree in Computer Science, Statistics, Mathematics, or a related field is mandatory, with a preference for candidates holding advanced degrees. Experience in AI/ML projects, internships, or relevant publications can provide an edge.\n2. Deep expertise and comprehension of generative AI models, especially GANs and VAEs, is essential.\n3. Proficiency in Python and thorough understanding of machine learning frameworks such as TensorFlow, PyTorch, or Keras is required.\n4. An in-depth understanding of machine learning theories, principles, and algorithms is a must.\n5. Exceptional problem-solving skills, outstanding analytical abilities, and meticulous attention to detail are pivotal.\n6. Strong communication skills, including the ability to elucidate complex AI concepts to non-technical stakeholders in a comprehensible manner, are needed.\n7. Robust teamwork skills and the aptitude to collaborate productively on projects within a diverse team are necessary.\n8. Familiarity with SQL and NoSQL databases, as well as an understanding of data structures and algorithms, provide added value.\n9. Prior experience or familiarity with cloud platforms such as AWS, Google Cloud, or Azure is preferred.\n10. Demonstrated interest or experience in NLP and reinforcement learning is highly desirable.\n11. The ability to analyze large data sets to extract valuable insights, and monitor model performance and data accuracy is crucial.\n12. A proven track record in AI/ML projects, internships, or publications is beneficial.",
      "responsibilities": "responsibilities:\n[Ask 20 questions]\n`-- Actively engage in the design, development, and execution of generative AI models, specifically focusing on GANs and VAEs.\n`-- Stay abreast of the latest advancements, trends, and technologies in AI and ML, incorporating these insights into our business solutions to drive innovation.\n`-- Work closely with cross-functional teams to optimize and streamline the processes involved in model development and deployment.\n`-- Analyze vast datasets to extract valuable insights that can be used to enhance and optimize our algorithms and models.\n`-- Regularly monitor and evaluate the performance and accuracy of AI models and data, implementing necessary adjustments and improvements to ensure optimal results.\n`-- Clearly articulate complex AI and ML concepts to non-technical stakeholders, promoting understanding and knowledge sharing.\n`-- Contribute actively to research and development initiatives, aiding in the creation and refinement of machine learning algorithms and models.\n`-- Proactively identify potential areas for AI application and improvement within the organization, fostering a culture of innovation and growth.\n`-- Uphold the company's standards of excellence in all tasks and projects, maintaining a high level of professionalism and work ethic.\n`-- Encourage a collaborative and innovative work environment, contributing to team efforts, supporting colleagues, and ensuring the successful completion of projects.\n`-- Commit to continuous learning and development in AI, ML, and related fields, keeping up-to-date with industry trends, new technologies, and best practices to enhance the company's AI capabilities and drive innovation.",
      "interview_style": "interview_style:\nThe given set of questions are technical and straightforward, designed to evaluate the candidate's specific knowledge and comprehension of diverse concepts in Data Science and AIML. These questions are concentrated on the candidate's familiarity with the terminology, concepts, and operations unique to Data Science and AIML. It requires the candidate to demonstrate in-depth knowledge, practical experience, problem-solving skills, a commitment to continuous learning, technical proficiency, and specific domain knowledge.\n",
      "industry_benchmark":"industry_benchmark: The bot should ask 2 questions to be at the proficiency level of a Kaggle Grandmaster."
    },
    {
      "skill_level": "skill_level: Data Scientist (PL2)\n",
      "difficulty": "difficulty: (Ask MEDIUM complexity questions)\n",
      "skill_list": "skill_list:\n1. A Bachelor's, Master's degree, or Ph.D. in Computer Science, Statistics, Mathematics, or a related field is required.\n2. Demonstrated experience as a Machine Learning Engineer, Data Scientist, or a similar role is mandatory. \n3. Proficiency in Python and familiarity with machine learning frameworks such as TensorFlow, PyTorch, or Keras is expected.\n4. Extensive experience in designing, developing, and deploying generative AI models, particularly GANs and VAEs, is crucial.\n5. A strong understanding of machine learning theories and principles is essential.\n6. Excellent problem-solving skills, attention to detail, and analytical abilities are required.\n7. Strong communication and teamwork skills, with the ability to communicate complex AI concepts to non-technical stakeholders, is important.\n8. Ability to work with cross-functional teams to establish model development and deployment pipelines is desirable.\n9. Proven ability to monitor AI model performance and data accuracy, and implement improvements as needed is necessary.\n10. Familiarity with SQL and NoSQL databases and experience with cloud platforms such as AWS, Google Cloud, or Azure is preferred.\n11. Experience in analyzing large data sets and extracting valuable insights is vital.\n12. Up-to-date knowledge of the latest advancements in AI and ML technologies and the capability to implement them is beneficial.\n13. Experience with NLP and reinforcement learning is advantageous.\n14. Publications in AI/ML conferences or journals would be a plus.\n15. The ability to stay abreast with the rapid advancements in the AI and ML field is expected.",
      "responsibilities": "responsibilities:\n[Ask 20 questions]\n`-- Design, develop and deploy advanced generative AI models, focusing heavily on GANs and VAEs, while continually refining them as per latest advancements in AI and ML technologies.\n`-- Collaborate with cross-functional teams to streamline the efficient development and deployment of AI models, ensuring their reliability and relevance.\n`-- Analyze large, complex datasets to extract valuable insights that can be used to optimize and refine AI algorithms and machine learning models.\n`-- Consistently monitor the performance and accuracy of AI models, implementing improvements as necessary to ensure optimal performance and reliability.\n`-- Effectively communicate intricate AI concepts and findings to both technical and non-technical stakeholders, ensuring they understand the value and impact of the work.\n`-- Drive innovation within the company by enhancing AI capabilities, integrating AI models into existing systems and processes, and developing robust machine learning algorithms.\n`-- Stay informed about industry trends and advancements in AI and ML technologies to ensure the company's AI capabilities remain competitive.\n`-- Develop and implement strategic solutions to tackle business challenges using AI and ML technologies, regularly assessing their effectiveness.\n`-- Provide technical guidance and support to other team members, fostering a collaborative and learning environment.\n`-- Adhere to data privacy and security standards when handling sensitive information, ensuring trust and compliance.\n`-- Regularly review, adjust, and improve AI models to ensure their relevance, accuracy, and overall performance.\n`-- Actively participate in team meetings and brainstorming sessions to discuss AI projects and strategies, adding value to team dynamics.\n`-- Contribute to publications and presentations to share the company's AI initiatives and accomplishments with the broader community.",
      "interview_style": "interview_style:\nThis set of questions, crafted with more depth and based on real-world scenarios, aims to evaluate the candidate's theoretical knowledge as well as hands-on experience in various facets of Data Science and AIML. For an ML engineer, the questions are not just limited to their technical prowess. They are also designed to measure their ability to mentor junior data scientists effectively, and their competence to independently liaise with clients to understand and gather data science requirements. This comprehensive evaluation will provide insight into the candidate's technical skills, leadership capacity, and client management abilities, ensuring they are well-rounded in every aspect required for the role.\n",
      "industry_benchmark":"industry_benchmark: The bot should ask 4 questions to be at the proficiency level of a Kaggle Grandmaster and  a Cloud Solutions Architect."
    },
    {
      "skill_level": "skill_level: AIML Architect (PL3)\n",
      "difficulty": "difficulty: (Ask HARD complexity questions)\n",
      "skill_list": "skill_list:\n1. Demonstrated exceptional expertise and professional experience in AI and machine learning, with a specific focus on Language Models (LLM) and Generative AI technologies. \n2. Proficiency in designing, developing, implementing, and maintaining advanced LLM systems across a range of applications.\n3. Proficient in programming languages like Python, Java, or similar, and knowledgeable in AI and machine learning platforms such as TensorFlow, PyTorch, as well as cloud platforms like AWS, GCP, or Azure.\n4. Strong analytical and problem-solving skills to analyze complex datasets for improving model performance, along with proficiency in validating and optimizing machine learning models for deployment and production purposes.\n5. Experience in creating and maintaining robust data pipelines for machine learning model training and deployment.\n6. Comprehensive understanding of data security, integrity, and confidentiality best practices, with strict adherence to data privacy regulations.\n7. Excellent collaboration skills, with demonstrated ability to effectively work with cross-functional teams, including data scientists, engineers, and product managers.\n8. Ability to communicate complex technical concepts effectively to both technical and non-technical stakeholders.\n9. Strong attention to detail and excellent documentation skills for accurately capturing processes, designs, and updates.\n10. Familiarity with Agile/Scrum development process and experience with publications in reputed AI or ML journals would be advantageous.\n11. A Master's degree or higher in a relevant field such as Computer Science, Artificial Intelligence, Machine Learning, Mathematics, Engineering, or a related field.\n12. Proven professional experience in AI/ML roles with a preference for experience as an LLM Architect.\n13. Commitment to staying current with the latest trends and advancements in generative AI, machine learning, and LLM technologies.\n14. Willingness to travel occasionally to client locations or conferences.\n15. Exceptional problem-solving skills, analytical abilities, and a detail-oriented mindset.\n",
      "responsibilities": "responsibilities:\n[Ask 20 questions]\n`-- Designing, developing, implementing, and maintaining advanced LLM systems for generative AI applications.\n`-- Collaborating with cross-functional teams to develop high-performance AI algorithms and predictive models.\n`-- Staying updated with the latest trends and advancements in generative AI, machine learning, and LLM technologies.\n`-- Building and maintaining robust data pipelines for machine learning model training and deployment.\n`-- Analyzing complex datasets to enhance model performance and ensure the robustness of the implemented models.\n`-- Validating and optimizing machine learning models for deployment and production use, while adhering to data security, integrity, and confidentiality standards.\n`-- Complying with data privacy regulations and best practices in all operations.\n`-- Documenting all processes, designs, and updates comprehensively for future reference and transparency.\n`-- Communicating complex technical concepts effectively to both technical and non-technical stakeholders.\n`-- Actively participating in team meetings, conferences, and professional development activities to share insights and stay abreast of the latest advancements.\n`-- Leading research and development activities to identify new opportunities for implementing LLM and generative AI technologies, and potentially publishing findings in recognized AI or ML journals.\n`-- Managing multiple projects simultaneously, efficiently prioritizing tasks based on deadlines and importance.\n`-- Regularly reviewing, troubleshooting, and improving existing systems and models for optimal performance.\n`-- Conducting regular system tests and performance checks to ensure high performance, security, and continual improvement of existing systems and models.\n`-- Mentoring and providing guidance to junior team members, helping them improve their skills and knowledge in AI and ML technologies.\n`-- Occasionally traveling to client locations or conferences for project execution and knowledge exchange.\n`-- Adhering to project timelines and resource allocation plans for efficient project management, while ensuring data security and confidentiality regulations are met.\n`-- Regularly delivering reports on system performance, progress, and the latest advancements in the field.\n`-- Participating in professional development activities to stay updated with the latest developments in the field.\n",
      "interview_style": "interview_style:\nThis meticulously curated set of questions is designed with a high level of specificity, focusing on the practical application of Data Science. For an Architect level candidate with LLM skill, these questions not only measure their technical comprehension, experience, and problem-solving abilities in Data Science and AIML, but also assess their capability to design GenAI-based applications' architecture from scratch, suitable for both cloud and on-premises platforms.\n",
      "industry_benchmark":"industry_benchmark: The bot should ask 8 questions to be at the proficiency level of a Kaggle Grandmaster and  a Cloud Solutions Architect."

    },
  ];

  const downloadTextTemplate = (templateNumber) => {
    const template = templates[templateNumber - 1];
    const templateData = Object.values(template).join("\n\n");
    const txt = new Blob([templateData], { type: 'text/plain;charset=utf-8;' });
    const fileName = `Interview_Skill_Template_PL_${templateNumber}.txt`;
    saveAs(txt, fileName);
  };

  const guidelinesList = [
    'In the excel sheet template, you will find pre-written interview skills, each corresponding to template 1 (PL1), template 2 (PL2), and template 3 (PL3) respectively.',
    'When adding a new interview skill, refer template1.txt, template2.txt, and template3.txt to write the interview skill description. Closely follow only these 3 patterns.',
    'You can add any number of interview skills with different templates.',
    'Each interview skill should follow either template 1/template 2/template 3 only.', 
    'Click on the \'Download Existing Interview Skills\' button to view the existing interview skills available with us',
    'Failure to follow these guidelines may result in improper behaviour of interview bot and/or issues with the interview application. Please ensure that you adhere to the guidelines to ensure a smooth experience.'   
  ];

  const downloadJDFile = () => {
    const JDnames = allJD.map(item => item.name + ' - ' +  item.skill_level_version);
    const textToWrite = JDnames.join('\n');
    const element = document.createElement('a');
    const file = new Blob([textToWrite], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = 'Existing_Interview_Skills.txt';
    document.body.appendChild(element);
    element.click();
  };

  return (
    <div className="minheight grad">
      <Container>
      <Link
          className='btn btn-outline-light my-3 py-2'
          to='/'
        >
          <FontAwesomeIcon icon={faArrowLeft} className="mx-2"/> Go Home
      </Link>
        <Row className='d-flex justify-content-center align-items-center bulkupload-custom-row'>
          <Col
            className='d-flex justify-content-center align-items-center m-1'
          >
            <Card className='bulkupload-card-rounded  p-2'>
              {error && <Message variant='danger'>error</Message>}
              <Card.Header style={{ color: "#08084e" }} as='h4' className="mb-3">
                Upload Interview Skills
              </Card.Header>
              <Card.Body>
                <div>
                  {loading && <Loader />}
                  <Form onSubmit={submitHandler}>
                    <div className="guidelines">
                      <h4>Guidelines</h4>
                      <ol>
                        {guidelinesList.map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ol>
                      <div className="guidelines">
                        <h4>Interview Skill Upload Excel Template</h4>
                        <Button className='m-2' variant='outline-secondary' size="sm" onClick={downloadExcelTemplate}>
                          Download Interview Skill Upload Template
                        </Button>
                      </div>
                      <div className="guidelines">
                        <h4>Existing Skill level list</h4>
                        <Button className='m-2' variant='outline-secondary' size="sm" onClick={downloadJDFile}>
                          Download Existing Interview Skills list
                        </Button>
                      </div>
                      <div className="guidelines">
                        <h4>Interview Skill Samples</h4>
                        <Button className='m-2' variant='outline-secondary' size="sm" onClick={() => downloadTextTemplate(1)}>
                          Download Interview Skill Template 1 (PL1)
                        </Button>
                        <Button className='m-2' variant='outline-secondary' size="sm" onClick={() => downloadTextTemplate(2)}>
                        Download Interview Skill Template 2 (PL2)
                        </Button>
                        <Button className='m-2' variant='outline-secondary' size="sm" onClick={() => downloadTextTemplate(3)}>
                        Download Interview Skill Template 3 (PL3)
                        </Button>
                      </div>
                    </div>
                    <Form.Group
                      className='mb-4'
                      controlId='formGridResUpload'
                      aria-describedby='fileHelpBlock'
                    >
                      <Form.Label>Upload Skill levels Excel File here.</Form.Label>
                      <Form.Control
                        type='file'
                        id="fileInput"
                        accept='.csv, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                        maxSize={5 * 1024 * 1024}
                        placeholder='Upload CSV or Excel File.'
                        onChange={JDUploadHandler}
                        required
                      />
                    </Form.Group>
                    <Button className='my-2' variant='btn btn-outline-light' type='submit' >
                      SUBMIT
                    </Button>
                  </Form>
                  {excelData ? (
                    <div className="table-container" style={{ maxHeight: "500px", overflow: "auto" }}>
                      <Table responsive className="table-card text-center borderless">
                        <thead className="custom-col white">
                          <tr>
                            {Object.keys(excelData[0]).map((key) => (
                              <th key={key}>{key}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {excelData.map((individualExcelData, index) => (
                            <tr key={index}>
                              {Object.keys(individualExcelData).map((key) => (
                                <td key={key}>{individualExcelData[key]}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  ) : (
                    <div></div>
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  )
}

export default UploadJDScreen