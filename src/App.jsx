import { useState, useEffect } from "react";
import "./SearchComponent.css";

export default function SearchComponent() {
  const [query, setQuery] = useState("");
  const [count, setCount] = useState(1);
  const [ws, setWs] = useState(null);
  const [images, setImages] = useState([]);
  const [liveImages, setLiveImages] = useState([]);
  const [latestImage, setLatestImage] = useState(null); // Track latest image for the card
  const [allTasks, setAllTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [liveLoading, setLiveLoading] = useState(false);
  const [showLiveContainer, setShowLiveContainer] = useState(false);

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
      const userID = getUserID();
      socket.send(JSON.stringify({ type: "reconnect", userID }));
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.image) {
          setImages((prev) => [...prev, data.image]);
        }

        if (data.type === "live_image") {
          setLiveImages((prev) => [...prev, data.image]);
          setLatestImage(data.image); // Update latest image for card
        }

        if (data.allTask) {
          setAllTasks(data.allTask);
        }
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
      setLiveImages([]);
      setLatestImage(null);
      setLoading(true);
      setLiveLoading(true);
      setShowLiveContainer(true);

      ws.send(JSON.stringify({ type: "request_images", query, count, userID }));
    }
  };

  useEffect(() => {
    if (liveImages.length === count) {
      setLiveLoading(false);
      setLoading(false);
      setTimeout(() => {
        window.location.reload();
      }, 100);
    }
  }, [liveImages, count]);
  // debugging
  // useEffect(() => {
  //   if (liveImages.length === count) {
  //     setLiveLoading(false);
  //     setLoading(false);
  
  //     // Add new campaign data to allTasks without reloading
  //     const newTask = {
  //       _id: Date.now().toString(), // Temporary unique ID
  //       query: query,
  //       createdAt: new Date().toISOString(),
  //       images: [...liveImages]
  //     };
  
  //     setAllTasks((prev) => [newTask, ...prev]); // Add new campaign at the top

  
  //     // Hide live container after data is moved to data-container
  //     setTimeout(() => {
  //       setLiveImages([]); // Clear live images
  //       setShowLiveContainer(false); // Hide live container
  //     }, 100); // Small delay for smooth transition
  //   }
  // }, [liveImages, count]);
  

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
          max="30"
          className="count-input"
        />
        <button onClick={handleSearch} className="search-button" disabled={loading}>
          {loading ? "Loading..." : "Search"}
        </button>
      </div>

      {showLiveContainer && (
        <div className="live-container">
          {liveLoading && <p>Loading...</p>}
          {liveImages.length > 0 ? (
            liveImages.map((img, index) => (
              <div key={index} className="image-container">
                <img
                  src={window.location.origin + img}
                  alt={`Live Image ${index + 1}`}
                  className="live-image"
                />
                {latestImage === img && (
                  <div className="image-card right-side">
                    <div className="loader"></div> {/* Loader inside the card */}
                  </div>
                )}
              </div>
            ))
          ) : (
            <p>Generate new Campaign</p>
          )}
        </div>
      )}

      <div className="data-container">
        {[...allTasks].reverse().map((task, index) => (
          <div key={task._id} className="task">
            <p><strong>Campaign:</strong> {task.query}</p>
            <p><strong>Date&Time:</strong> {new Date(task.createdAt).toLocaleString()}</p>
            <div className="task-images">
              {task.images.map((img, i) => (
                <img
                  key={i}
                  src={window.location.origin + img}
                  alt={`Task ${index + 1} Image ${i + 1}`}
                  className="image"
                />
              ))}
            </div>
          </div>
        ))}
        {/* {allTasks.map((task, index) => ( // No need to reverse() if new items are added on top
          <div key={task._id} className="task">
            <p><strong>Campaign:</strong> {task.query}</p>
            <p><strong>Date&Time:</strong> {new Date(task.createdAt).toLocaleString()}</p>
            <div className="task-images">
              {task.images.map((img, i) => (
                <img key={i} src={window.location.origin + img} alt={`Task ${index + 1} Image ${i + 1}`} className="image" />
              ))}
            </div>
          </div>
        ))} */}

      </div>
    </div>
  );
}



// function clickSearch(onClick) {
//   const searchElement = document.getElementById("searchBox");
//   searchElement.style.display= "block";
// };









// --------------------------------------------------------------------------------------------------------------
// Logic with Task Scheduling BUT NO LIVE IMAGES 
// import { useState, useEffect } from "react";
// import "./SearchComponent.css";

// export default function SearchComponent() {
//   const [query, setQuery] = useState("");
//   const [count, setCount] = useState(1);
//   const [ws, setWs] = useState(null);
//   const [images, setImages] = useState([]);
//   const [allTasks, setAllTasks] = useState([]);


//   // Generate or retrieve stored user ID
//   const getUserID = () => {
//     let userID = localStorage.getItem("userID");
//     if (!userID) {
//       userID = `user_${Math.random().toString(36).substr(2, 9)}`;
//       localStorage.setItem("userID", userID);
//     }
//     return userID;
//   };

//   useEffect(() => {
//     const socket = new WebSocket("ws://localhost:8080");
//     setWs(socket);

//     socket.onopen = () => {
//       console.log("Connected to WebSocket server");

//       // Send user ID to backend on connection
//       const userID = getUserID();
//       socket.send(JSON.stringify({ type: "reconnect", userID }));
//     };

//     socket.onmessage = (event) => {
//       try {
//         const data = JSON.parse(event.data);
//         if (data.image) {
//           setImages((prev) => [...prev, data.image]); // Append images
//         }
//         if (data.allTask) {
//           setImages([]); // Clear existing images before adding new ones
//           setAllTasks(data.allTask); // Store full task details
//           console.log("data alltask", data.allTask)
//         }

//         console.log("Received WebSocket data:", data);
//       } catch (error) {
//         console.error("Error parsing WebSocket message:", error);
//       }
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
//       const userID = getUserID();
//       ws.send(JSON.stringify({ type: "request_images", query, count, userID }));
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
//        {/* Live Request Container */}
//        <div className="live-container">
//         <h3>Live Request</h3>
//         {images.length > 0 ? (
//           images.map((img, index) => (
//             <img key={index} src={window.location.origin + img} alt={`Live Image ${index + 1}`} className="image" />
//           ))
//         ) : (
//           <p className="placeholder">Generate New Report</p>
//         )}
//       </div>

//       {/* Previous Requests */}
//       <div className="data-container">
//         {allTasks.length > 0 ? (
//           // allTasks.map((task, index) => ( 
//           // for descinding order of cards (latest first).
//           [...allTasks].reverse().map((task, index) => (
//             <div key={index} className="task-card">
//               <h3>{task.query}</h3>
//               <p className="timestamp">{new Date(task.createdAt).toLocaleString()}</p>
//               <div className="image-grid">
//                 {task.images.map((img, imgIndex) => (
//                   <img
//                     key={imgIndex}
//                     src={window.location.origin + img}
//                     alt={`Task Image ${imgIndex + 1}`}
//                     className="image"
//                   />
//                 ))}
//               </div>
//             </div>
//           ))
//         ) : (
//           <p>No images yet...</p>
//         )}
//       </div>

//     </div>
//   );
// }








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
