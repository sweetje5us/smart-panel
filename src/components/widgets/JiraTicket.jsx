import React, { useState } from 'react';

const JiraTicketDetails = ({ ticket }) => {
  const [showDetails, setShowDetails] = useState(false);

  const handleToggleDetails = () => {
    setShowDetails(!showDetails);
  };

  return (
    <div className="jira-ticket-details">
      <button onClick={handleToggleDetails}>
        {showDetails ? 'Hide Details' : 'Show Details'}
      </button>
      {showDetails && (
        <div className="ticket-details">
          <h2>{ticket.key}</h2>
          <p>{ticket.summary}</p>
          <p>Status: {ticket.status}</p>
          <p>Assignee: {ticket.assignee}</p>
          {/* Add more details as needed */}
        </div>
      )}
    </div>
  );
};

export default JiraTicketDetails;

