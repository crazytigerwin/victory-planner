import React, { useState, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";

// Minimal CSS to make calendar render correctly
const calendarStyles = `
.fc {
  font-family: Arial, sans-serif;
}
.fc-toolbar {
  margin-bottom: 10px;
}
.fc th, .fc td {
  border: 1px solid #ddd;
  padding: 5px;
  text-align: center;
}
.fc-daygrid-day-number {
  font-weight: bold;
}
.fc-daygrid-event {
  background-color: #3788d8;
  color: white;
  padding: 2px 4px;
  border-radius: 3px;
  font-size: 0.85em;
}
`;

const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = calendarStyles;
document.head.appendChild(styleSheet);

function GoogleLikeCalendar() {
  const calendarRef = useRef(null);
  const [events, setEvents] = useState([]);

  // When user clicks a date
  const handleDateClick = (info) => {
    const title = prompt("Enter event title:");
    if (title) {
      setEvents([
        ...events,
        { title, start: info.dateStr, allDay: true },
      ]);
    }
  };

  return (
    <div
      style={{
        maxWidth: "900px",
        margin: "0 auto",
        padding: "20px",
        backgroundColor: "#fff",
        borderRadius: "8px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
      }}
    >
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
        }}
        selectable={true}
        dateClick={handleDateClick}
        events={events}
        height="auto"
      />
    </div>
  );
}

export default GoogleLikeCalendar;
