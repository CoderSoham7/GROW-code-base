import React, {useState} from 'react';

const ResultAccordion = ({ accordionData }) => {
  const [openItems, setOpenItems] = useState([]);

  const toggleAccordion = (itemId) => {
    if (openItems.includes(itemId)) {
      setOpenItems(openItems.filter((id) => id !== itemId));
    } else {
      setOpenItems([...openItems, itemId]);
    }
  };

  const formatContent = (content) => {
    const formattedContent = content.replace(/^:\s?/, "").replace(/-\s/g, "\n\n-");
    const lines = formattedContent.split('\n').map((line, index) => <p key={index}>{line.trim()}</p>);
    
    if (lines.length > 0) {
      const lastLine = lines[lines.length - 1];
      if (lastLine.props.children === '') {
        lines[lines.length - 1] = <p key={lines.length - 1}>{lastLine.props.children}</p>;
      }
    }
    
    return lines;
  };

  return (
    <div className="accordion">
      {accordionData.map((item, index) => (
        <div className="accordion-item" key={index}>
          <div className="accordion-header" onClick={() => toggleAccordion(index)}>
            <div className="accordion-header-content">
              <span className="accordion-header-text">{item.heading}</span>
            </div>
            <div className="accordion-toggle-icon-container">
              <span className={`accordion-toggle-icon ${openItems.includes(index) ? 'active' : ''}`}>
                &#x25bc;
              </span>
            </div>
          </div>
          {openItems.includes(index) && (
            <div className="accordion-content">
              {index === 0 ? (
                <>
                  {item.content && item.content.map((line, lineIndex) => (
                    <p key={lineIndex}>{line}</p>
                  ))}
                </>
              ) : (
                formatContent(item.content)
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ResultAccordion;