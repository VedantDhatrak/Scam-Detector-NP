import { useState, useEffect } from "react";
import "./SearchComponent.css";

export default function SearchComponent() {
  const [query, setQuery] = useState("");
  const [count, setCount] = useState(1);
  const [ws, setWs] = useState(null);
  const [images, setImages] = useState([]);
  // debugging
  // const [displayedImages, setDisplayedImages] = useState([]);


  // useEffect(() => {
  //   if (images.length > 0) {
  //     setDisplayedImages([]);
  //     images.forEach((img, index) => {
  //       setTimeout(() => {
  //         setDisplayedImages((prev) => [...prev, img]);
  //       }, index * 5000); // 5 seconds delay for each image
  //     });
  //   }
  // }, [images]);

  useEffect(() => {
    // setDisplayedImages([]);
    const socket = new WebSocket("ws://localhost:8080");
    setWs(socket);

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.image) {
          setImages((prev) => [...prev, data.image]); // Append new image instead of replacing
        }
        // setImages(data.images || []);
        console.log("sockt data",event.data);
        // setDisplayedImages((prev) => [...prev, data.images]);
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    socket.onopen = () => {
      console.log("Connected to WebSocket server");
    };

    socket.onclose = () => {
      console.log("WebSocket disconnected");
    };

    return () => {
      socket.close();
    };
  }, [  ]);

  const handleSearch = () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ query, count }));
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
        {images.length > 0 ? (
          images.map((img, index) => (
            <img key={index} src={window.location.origin + img} alt={`Image ${index + 1}`} className="image" />
          ))
        ) : (
          <p>No images yett...</p>
        )}
      </div>
      {/* debugging */}
      {/* <div className="data-container">
        {displayedImages.length > 0 ? (
          displayedImages.map((img, index) => (
            <img key={index} src={window.location.origin + img} alt={`Image ${index + 1}`} className="image" />
          ))
        ) : (
          <p>No Posts yet...</p>
        )}
      </div> */}
    </div>
  );
}









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
