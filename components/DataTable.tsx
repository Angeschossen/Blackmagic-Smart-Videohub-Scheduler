import * as React from 'react';
import { IColumn, buildColumns, SelectionMode, Toggle, IListProps, IObjectWithKey, Selection, Link } from '@fluentui/react';
import { ShimmeredDetailsList } from '@fluentui/react/lib/ShimmeredDetailsList';

export interface TableInput {
    onClickEdit?: (event: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement | HTMLElement>, item: any) => void,
    getData: () => any[] | undefined,
    editText: string,
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

        if (column.key === 'edit' && this.props.onClickEdit != undefined) {
            return <Link
                //data-selection-invoke={true}
                onClick={e => {
                    if (this.props.onClickEdit != undefined) {
                        this.props.onClickEdit(e, item);
                    }
                }}>{this.props.editText}</Link>;
        }

        return item[column.key as keyof TableItem];
    };

    componentDidMount() {
        if(this.mounted){
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

            if (this.props.onClickEdit != undefined) {
                this.shimmerColumns.unshift({
                    key: 'edit',
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
        for(; index < this.shimmerColumns.length; index++){
            if(this.shimmerColumns[index].key == "id"){
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
            setTimeout(this.loadData, 5000);
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
