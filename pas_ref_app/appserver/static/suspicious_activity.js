require([
    "splunkjs/ready!",
    "splunkjs/mvc/simplexml/ready!",
    "splunkjs/mvc/tableview"
], function(
    mvc,
    ignored,
    TableView
) {
    var CustomIconCellRenderer = TableView.BaseCellRenderer.extend({
        canRender: function(cell) {
            return cell.field === 'Code';  // the color column
        },
        
        render: function($td, cell) {
            $td.html('<span style="font-size: 3em; color: ' + cell.value + '">&#x25CF;</span>');
        }
    });
    
    var tableElement = mvc.Components.getInstance('suspicious_activity_table');
    tableElement.getVisualization(function(tableView) {
        tableView.table.addCellRenderer(new CustomIconCellRenderer());
        tableView.table.render();
    });
});
