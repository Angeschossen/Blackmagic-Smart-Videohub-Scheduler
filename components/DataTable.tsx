import * as React from 'react';
import { IColumn, buildColumns, SelectionMode, Toggle, IListProps, IObjectWithKey, Selection, Link, Stack, RefObject } from '@fluentui/react';
import { ShimmeredDetailsList } from '@fluentui/react/lib/ShimmeredDetailsList';
import { areArrayIdentical, getRandomKey } from './utils/commonutils';
import { Key } from 'react';

export interface TableInput {
    controlcolumns: ControlColumns[],
    getData: (last?: Date) => Promise<any[] | undefined>,
    display: boolean,
}

export interface ControlColumns {
    key: string,
    onClick: (event: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement | HTMLElement>, item: any) => void,
    text: string,
}

export interface TableItem {

}

const shimmeredDetailsListProps: IListProps = {
    renderedWindowsAhead: 0,
    renderedWindowsBehind: 0,
};

interface TableData {
    columns: IColumn[],
    items?: any[],
    last?: Date,
}

// <TableInput, { visibleCount: number, lastIntervalId: NodeJS.Timer | undefined, items?: TableItem[] }>
export const DataTable = (props: TableInput) => {

    let tableData = React.useRef<TableData>({ columns: [], items: undefined, last: undefined });
    const retrieveTimeout: any = React.useRef<NodeJS.Timeout | undefined>(null);
    const [data, setData] = React.useState<TableData>(tableData.current);

    React.useEffect(() => {
        scheduleRetrieveData(0);
    }, []);

    async function loadData() {
        console.log("Retrieving table items...");
        const items: any[] | undefined = await props.getData(tableData?.current?.last);
        if (items == undefined) {
            console.log("No update.");
            return; // no change
        }

        let columns: IColumn[];
        if (items.length == 0) {
            return
        }

        columns = buildColumns(items);
        for (const col of props.controlcolumns) {
            columns.unshift({
                key: col.key,
                name: '',
                minWidth: 0,
                maxWidth: 1,
            });
        }

        // remove internal id field
        let index: number = 0;
        let found: boolean = false;
        for (; index < columns.length; index++) {
            const col: IColumn = columns[index];
            if (col.key === "id") {
                found = true;
                index = index;
                break;
            }
        }

        if (found) {
            columns.splice(index, 1);
        }

        tableData.current = { columns: columns, items: items, last: new Date()};
        setData(tableData.current);
        
        console.log("Items loaded: " + (items == undefined ? "undefined" : items.length));
    }

    function scheduleRetrieveData(timeout: number) {
        if (retrieveTimeout.current != undefined) {
            clearTimeout(retrieveTimeout.current);
        }

        retrieveTimeout.current = setTimeout(async () => {
            await loadData();
            scheduleRetrieveData(1000);
        }, timeout);
    }


    function onRenderItemColumn(item?: any, index?: number, column?: IColumn): JSX.Element | string | number {
        if (column == undefined) {
            return <></>;
        }

        let control: ControlColumns | undefined;
        for (const col of props.controlcolumns) {
            if (col.key === column.key) {
                control = col;
                break;
            }
        }

        if (control != undefined) {
            return <Link
                //data-selection-invoke={true}
                onClick={e => {
                    control?.onClick(e, item);
                }}>{control.text}</Link>;
        }

        return item[column.key as keyof TableItem];
    };


    return (
        <>
            {props.display && <ShimmeredDetailsList
                setKey="items"
                items={tableData.current.items || []}
                columns={tableData.current.columns}
                selectionMode={SelectionMode.none}
                onRenderItemColumn={onRenderItemColumn}
                enableShimmer={tableData.current.items == undefined}
                ariaLabelForShimmer="Content is being fetched"
                ariaLabelForGrid="Item details"
                listProps={shimmeredDetailsListProps}
            />}
        </>
    );
}

export default DataTable;
