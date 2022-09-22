import * as React from 'react';
import { IColumn, buildColumns, SelectionMode, Toggle, IListProps, IObjectWithKey, Selection, Link } from '@fluentui/react';
import { ShimmeredDetailsList } from '@fluentui/react/lib/ShimmeredDetailsList';

export interface TableInput {
    onClickEdit: (item: any) => void,
    getData: () => any[] | undefined,
    shouldForceRefresh: ()=>boolean,
    onClick?: (event: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement | HTMLElement>, item: any) => void,
}

export interface TableItem {

}

const shimmeredDetailsListProps: IListProps = {
    renderedWindowsAhead: 0,
    renderedWindowsBehind: 0,
};

class DataTable<K, T> extends React.Component<TableInput, { visibleCount: number, lastIntervalId: NodeJS.Timer | undefined, items?: TableItem[] }> {

    private shimmerColumns: IColumn[] = [];

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
                    if (this.props.onClick != undefined) {
                        this.props.onClick(e, item);
                    }
                }}>{"Edit"}</Link>;
        }

        return item[column.key as keyof TableItem];
    };

    componentDidMount() {
        this.loadData();
    }


    loadData = (): void => {
        console.log("Loading")
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

        // refreshes view
        this.setState({
            items: items
        }, () => {
            setTimeout(this.loadData, this.props.shouldForceRefresh()?1000:30000);
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
