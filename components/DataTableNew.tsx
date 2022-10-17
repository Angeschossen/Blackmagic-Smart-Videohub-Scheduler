import { Table, TableBody, TableCell, TableCellLayout, TableHeader, TableHeaderCell, TableRow } from '@fluentui/react-components/unstable';
import React from 'react';

export interface TableInput {
    getItems: () => Promise<DataTableItem[] | undefined>,
    tableUpdate: number,
    columns: DataTableColumn[],
}

export interface DataTableColumn {
    key: string,
    label: string,
}

export interface DataTableItem {
    key: string | number,
    cells: JSX.Element[],
}


interface TableData {
    items?: DataTableItem[],
}

export interface DataItem {
    key: string | number,
}

export function buildDataTableItems(items: DataItem[]): DataTableItem[] {
    const data: DataTableItem[] = [];

    for (const item of items) {
        const cells: JSX.Element[] = []

        for (const [k, v] of Object.entries(item)) {
            if (k != "key") {
                cells.push(
                    <TableCell>
                        <TableCellLayout>{v}</TableCellLayout>
                    </TableCell>
                );
            }
        }

        data.push({ key: item.key, cells: cells })
    }

    return data;
}


export const DataTable = (props: TableInput) => {
    const tableData = React.useRef<TableData>({ items: undefined });
    const [data, setData] = React.useState<TableData>(tableData.current);
    const getItems: any = React.useRef(props.getItems);

    React.useEffect(() => {
        async function loadData() {
            //console.log("Retrieving table items...");
            const items: DataTableItem[] | undefined = await getItems();
            if (items == undefined) {
                //console.log("No update.");
                return; // no change
            }

            if (items.length == 0) {
                //console.log("No items.");
                return
            }

            tableData.current = { items: items };
            setData(tableData.current);
            //console.log("Items loaded: " + (items == undefined ? "undefined" : items.length));
        }

        loadData();
    }, [props.tableUpdate]);

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    {props.columns.map(column => <TableHeaderCell key={column.key}>{column.label}</TableHeaderCell>)}
                </TableRow>
            </TableHeader>
            <TableBody>
                {tableData.current.items?.map(item =>
                    <TableRow key={item.key}>
                        {item.cells.map(cell =>
                            <TableCell key={cell.key}>
                                {cell}
                            </TableCell>
                        )}
                    </TableRow>)}
            </TableBody>
        </Table>
    );
}

export default DataTable;
