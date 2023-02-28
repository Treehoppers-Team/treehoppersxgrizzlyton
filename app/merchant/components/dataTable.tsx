import React, { useState } from "react";

interface TableRow {
  name: string;
  handle: string;
  number: number;
  status: "SUCCESSFUL" | "REDEEMED" | "UNSUCCESSFUL" | "PENDING";
}

interface TableProps {
  data: TableRow[];
}

const Table: React.FC<TableProps> = ({ data }) => {
  const [sortColumn, setSortColumn] = useState<string>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const sortedData = data.sort((a, b) => {
    const aValue = a[sortColumn as keyof TableRow];
    const bValue = b[sortColumn as keyof TableRow];
    if (aValue < bValue) {
      return sortDirection === "asc" ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortDirection === "asc" ? 1 : -1;
    }
    return 0;
  });

  const handleSort = (column: string) => {
    if (column === sortColumn) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  return (
    <div className="overflow-x-auto rounded-lg">
      <table className="w-full table-auto border-collapse">
        <thead className="text-black bg-gray-100">
          <tr>
            <th className="px-4 py-2">#</th>
            <th className="px-4 py-2" onClick={() => handleSort("name")}>
              Name{" "}
              {sortColumn === "name" && (sortDirection === "asc" ? "▲" : "▼")}
            </th>
            <th className="px-4 py-2" onClick={() => handleSort("handle")}>
              Handle{" "}
              {sortColumn === "handle" && (sortDirection === "asc" ? "▲" : "▼")}
            </th>
            <th className="px-4 py-2" onClick={() => handleSort("number")}>
              Number{" "}
              {sortColumn === "number" && (sortDirection === "asc" ? "▲" : "▼")}
            </th>
            <th className="px-4 py-2" onClick={() => handleSort("status")}>
              Status{" "}
              {sortColumn === "status" && (sortDirection === "asc" ? "▲" : "▼")}
            </th>
          </tr>
        </thead>
        <tbody className="text-gray-700">
          {sortedData.map((row, index) => (
            <tr key={index}>
              <td className="border px-4 py-2">{index + 1}</td>
              <td className="border px-4 py-2">{row.name}</td>
              <td className="border px-4 py-2">
                <a
                  href={`https://t.me/${row.handle}`}
                  className="font-light hover:text-blue-500"
                >
                  @{row.handle}
                </a>
              </td>
              
              <td className="border px-4 py-2"><a className="font-light hover:text-blue-500" href={`tel:{row.number}`}>{row.number}</a></td>
              <td className="border px-4 py-2">
                <span
                  className={`${
                    row.status === "REDEEMED"
                      ? "bg-green-500"
                      : row.status === "SUCCESSFUL"
                      ? "bg-blue-500"
                      : row.status === "UNSUCCESSFUL"
                      ? "bg-red-500"
                      : row.status === "PENDING"
                      ? "bg-yellow-500"
                      : ""
                  } text-white py-1 px-2 rounded-full`}
                >
                  {row.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
