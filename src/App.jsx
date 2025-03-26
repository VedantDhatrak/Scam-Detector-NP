// Logic with Task Scheduling 
import { useState, useEffect } from "react";
import "./SearchComponent.css";

export default function SearchComponent() {
  const [query, setQuery] = useState("");
  const [count, setCount] = useState(1);
  const [ws, setWs] = useState(null);
  const [images, setImages] = useState([]);
  const [allTasks, setAllTasks] = useState([]);


  // Generate or retrieve stored user ID
  const getUserID = () => {
    let userID = localStorage.getItem("userID");
    if (!userID) {
      userID = `user_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem("userID", userID);
    }
    return userID;
  };

  useEffect(() => {
    const socket = new WebSocket("ws://localhost:8080");
    setWs(socket);

    socket.onopen = () => {
      console.log("Connected to WebSocket server");

      // Send user ID to backend on connection
      const userID = getUserID();
      socket.send(JSON.stringify({ type: "reconnect", userID }));
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.image) {
          setImages((prev) => [...prev, data.image]); // Append images
        }
        if (data.allTask) {
          setImages([]); // Clear existing images before adding new ones
          setAllTasks(data.allTask); // Store full task details
          console.log("data alltask", data.allTask)
        }

        console.log("Received WebSocket data:", data);
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    socket.onclose = () => {
      console.log("WebSocket disconnected");
    };

    return () => {
      socket.close();
    };
  }, []);

  const handleSearch = () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      const userID = getUserID();
      ws.send(JSON.stringify({ type: "request_images", query, count, userID }));
    }
  };

  return (
    <div className="container">
      <div className="search-bar">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter search term"
          className="search-input"
        />
        <input
          type="number"
          value={count}
          onChange={(e) => setCount(Number(e.target.value))}
          min="1"
          max="10"
          className="count-input"
        />
        <button onClick={handleSearch} className="search-button">
          Search
        </button>
      </div>
      <div className="data-container">
        {allTasks.length > 0 ? (
          allTasks.map((task, index) => (
            <div key={index} className="task-card">
              <h3>{task.query}</h3>
              <p className="timestamp">{new Date(task.createdAt).toLocaleString()}</p>
              <div className="image-grid">
                {task.images.map((img, imgIndex) => (
                  <img
                    key={imgIndex}
                    src={window.location.origin + img}
                    alt={`Task Image ${imgIndex + 1}`}
                    className="image"
                  />
                ))}
              </div>
            </div>
          ))
        ) : (
          <p>No images yet...</p>
        )}
      </div>

    </div>
  );
}








// -----------------------------------------------------------------------------------------------------------------------------------------------------------
// Logic with DB
// import { useState, useEffect } from "react";
// import "./SearchComponent.css";

// export default function SearchComponent() {
//   const [query, setQuery] = useState("");
//   const [count, setCount] = useState(1);
//   const [ws, setWs] = useState(null);
//   const [images, setImages] = useState([]);
//   // debugging
//   // const [displayedImages, setDisplayedImages] = useState([]);


//   // useEffect(() => {
//   //   if (images.length > 0) {
//   //     setDisplayedImages([]);
//   //     images.forEach((img, index) => {
//   //       setTimeout(() => {
//   //         setDisplayedImages((prev) => [...prev, img]);
//   //       }, index * 5000); // 5 seconds delay for each image
//   //     });
//   //   }
//   // }, [images]);

//   useEffect(() => {
//     // setDisplayedImages([]);
//     const socket = new WebSocket("ws://localhost:8080");
//     setWs(socket);

//     socket.onmessage = (event) => {
//       try {
//         const data = JSON.parse(event.data);
//         if (data.image) {
//           setImages((prev) => [...prev, data.image]); // Append new image instead of replacing
//         }
//         // setImages(data.images || []);
//         console.log("sockt data",event.data);
//         // setDisplayedImages((prev) => [...prev, data.images]);
//       } catch (error) {
//         console.error("Error parsing WebSocket message:", error);
//       }
//     };

//     socket.onopen = () => {
//       console.log("Connected to WebSocket server");
//     };

//     socket.onclose = () => {
//       console.log("WebSocket disconnected");
//     };

//     return () => {
//       socket.close();
//     };
//   }, [  ]);

//   const handleSearch = () => {
//     if (ws && ws.readyState === WebSocket.OPEN) {
//       ws.send(JSON.stringify({ query, count }));
//     }
//   };

//   return (
//     <div className="container">
//       <div className="search-bar">
//         <input
//           type="text"
//           value={query}
//           onChange={(e) => setQuery(e.target.value)}
//           placeholder="Enter search term"
//           className="search-input"
//         />
//         <input
//           type="number"
//           value={count}
//           onChange={(e) => setCount(Number(e.target.value))}
//           min="1"
//           max="10"
//           className="count-input"
//         />
//         <button onClick={handleSearch} className="search-button">
//           Search
//         </button>
//       </div>
//       <div className="data-container">
//         {images.length > 0 ? (
//           images.map((img, index) => (
//             <img key={index} src={window.location.origin + img} alt={`Image ${index + 1}`} className="image" />
//           ))
//         ) : (
//           <p>No images yett...</p>
//         )}
//       </div>
//       {/* debugging */}
//       {/* <div className="data-container">
//         {displayedImages.length > 0 ? (
//           displayedImages.map((img, index) => (
//             <img key={index} src={window.location.origin + img} alt={`Image ${index + 1}`} className="image" />
//           ))
//         ) : (
//           <p>No Posts yet...</p>
//         )}
//       </div> */}
//     </div>
//   );
// }








// -------------------------------------------------------------------------------------------------------------------------
// import { useState, useEffect } from "react";
// import "./SearchComponent.css";

// export default function SearchComponent() {
//   const [query, setQuery] = useState("");
//   const [count, setCount] = useState(1);
//   const [ws, setWs] = useState(null);
//   const [response, setResponse] = useState("");

//   useEffect(() => {
//     const socket = new WebSocket("ws://localhost:8080");
//     setWs(socket);

//     socket.onmessage = (event) => {
//       setResponse(event.data);
//     };

//     socket.onopen = () => {
//       console.log("Connected to WebSocket server");
//     };

//     socket.onclose = () => {
//       console.log("WebSocket disconnected");
//     };

//     return () => {
//       socket.close();
//     };
//   }, []);

//   const handleSearch = () => {
//     if (ws && ws.readyState === WebSocket.OPEN) {
//       ws.send(JSON.stringify({ query, count }));
//     }
//   };

//   return (
//     <div className="container">
//       <div className="search-bar">
//         <input
//           type="text"
//           value={query}
//           onChange={(e) => setQuery(e.target.value)}
//           placeholder="Enter search term"
//           className="search-input"
//         />
//         <input
//           type="number"
//           value={count}
//           onChange={(e) => setCount(Number(e.target.value))}
//           min="1"
//           className="count-input"
//         />
//         <button onClick={handleSearch} className="search-button">
//           Search
//         </button>
//       </div>
//       <div className="data-container">
//         {response ? (
//           <p className="response-text">Server: {response}</p>
//         ) : (
//           <p>No data yet...</p>
//         )}
//       </div>
//     </div>
//   );
// }
