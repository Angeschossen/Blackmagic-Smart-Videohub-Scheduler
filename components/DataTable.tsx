import * as React from 'react';
import { IColumn, buildColumns, SelectionMode, Toggle, IListProps, IObjectWithKey, Selection, Link } from '@fluentui/react';
import { ShimmeredDetailsList } from '@fluentui/react/lib/ShimmeredDetailsList';

export interface TableInput {
    controlcolumns: ControlColumns[],
    getData: () => any[] | undefined,
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

class DataTable<K, T> extends React.Component<TableInput, { visibleCount: number, lastIntervalId: NodeJS.Timer | undefined, items?: TableItem[] }> {

    private shimmerColumns: IColumn[] = [];
    private mounted: boolean = false;
    constructor(props: TableInput) {
        super(props);

        this.state = {
            visibleCount: 0,
            lastIntervalId: undefined,
            items: undefined,
        }
    }

    onRenderItemColumn = (item?: any, index?: number, column?: IColumn): JSX.Element | string | number => {
        if (column == undefined) {
            return <></>;
        }

        let control: ControlColumns | undefined;
        for (const col of this.props.controlcolumns) {
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

    componentDidMount() {
        if (this.mounted) {
            return;
        }

        this.mounted = true;
        this.loadData();
    }


    loadData = (): void => {
        console.log("Loading table items...")
        const items: TableItem[] | undefined = this.props.getData();

        if (items != undefined) {
            this.shimmerColumns = buildColumns(items);

            for(const col of this.props.controlcolumns){
                this.shimmerColumns.unshift({
                    key: col.key,
                    name: '',
                    minWidth: 0,
                    maxWidth: 1
                });
            }
        } else {
            this.shimmerColumns = buildColumns([{ Loading: '' }]);
        }


        // remove internal id field
        let index: number = 0;
        let found: boolean = false;
        for (; index < this.shimmerColumns.length; index++) {
            if (this.shimmerColumns[index].key == "id") {
                found = true;
                break;
            }
        }

        if (found) {
            this.shimmerColumns.splice(index, 1);
        }

        // refreshes view
        this.setState({
            items: items
        }, () => {
            console.log("Items loaded: " + (items == undefined ? "undefined" : items.length));
        });
    }

    render() {
        return (
            <>
                <div>
                    <ShimmeredDetailsList
                        setKey="items"
                        items={this.state.items || []}
                        columns={this.shimmerColumns}
                        selectionMode={SelectionMode.none}
                        onRenderItemColumn={this.onRenderItemColumn}
                        enableShimmer={!this.state.items}
                        ariaLabelForShimmer="Content is being fetched"
                        ariaLabelForGrid="Item details"
                        listProps={shimmeredDetailsListProps}
                    />
                </div>
            </>
        );
    }
};

export default DataTable;
