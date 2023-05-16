//@ts-nocheck
import { useEffect, useState } from "react";
import getConfig from "next/config";

const { publicRuntimeConfig } = getConfig();
const { apiUrl } = publicRuntimeConfig;

function MyComponent() {
  const [data, setData] = useState([]);

  const fetchData = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/test`);
      const result = await response.json();
      setData([...data, result]);

      // Schedule the next fetch
      setTimeout(fetchData, 1000);
    } catch (error) {
      console.error("Error fetching data:", error);
      setTimeout(fetchData, 5000); // Retry after 5 seconds
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div>
      <h1>Streaming data:</h1>
      <ul>
        {data.map((item, index) => (
          <li key={index}>{JSON.stringify(item)}</li>
        ))}
      </ul>
    </div>
  );
}

export default MyComponent;
