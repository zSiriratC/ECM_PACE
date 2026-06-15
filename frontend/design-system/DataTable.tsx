import React from "react";

interface Column<T> {
    header: string;
    accessor: keyof T | ((row: T) => React.ReactNode);
    width?: string;
}

interface DataTableProps<T> {
    columns: Column<T>[];
    data: T[];
    keyField: keyof T;
}

export function DataTable<T>({ columns, data, keyField }: DataTableProps<T>) {
    return (
        <table>
            <thead>
                <tr>
                    {columns.map((col, i) => (
                        <th key={i} style={{ width: col.width }}>{col.header}</th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {data.map((row) => (
                    <tr key={String(row[keyField])}>
                        {columns.map((col, i) => (
                            <td key={i}>
                                {typeof col.accessor === "function"
                                    ? col.accessor(row)
                                    : String(row[col.accessor] ?? "")}
                            </td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
