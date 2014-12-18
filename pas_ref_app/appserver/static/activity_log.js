require([
    'underscore',
    'jquery',
    'splunkjs/mvc',
    'splunkjs/mvc/tableview',
    'splunkjs/mvc/simplexml/ready!'
], function(_, $, mvc, TableView, ignored) {
    // Translations from rangemap results to CSS class
    var ICONS = {
        severe: 'alert-circle',
        elevated: 'alert',
        low: 'check-circle'
    };

    var RangeMapIconRenderer = TableView.BaseCellRenderer.extend({
        canRender: function(cell) {
            // Only use the cell renderer for the range field
            return cell.field === 'range';
        },
        
        render: function($td, cell) {
            // Fetch the icon for the value
            var icon = 'question';
            if (ICONS.hasOwnProperty(cell.value)) {
                icon = ICONS[cell.value];
            }
            
            // Create the icon element and add it to the table cell
            $td.addClass('icon').html(_.template('<i class="icon-<%-icon%> <%- range %>" title="<%- range %>"></i>', {
                icon: icon,
                range: cell.value
            }));
        }
    });

    mvc.Components.get('activity_log').getVisualization(function(tableView) {
        // Register custom cell renderer
        tableView.table.addCellRenderer(new RangeMapIconRenderer());
        // Force the table to re-render
        tableView.table.render();
    });
});