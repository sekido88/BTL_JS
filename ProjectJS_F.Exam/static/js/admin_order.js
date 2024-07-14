$(document).ready(function() {
 
    $('button.button_show_more').on('click', function() {
        var orderId = $(this).data('order-id');
        $('.order-details[data-order-id="' + orderId + '"]').toggle();
    });

    $('.order-status-select').on('change', function() {
        var orderRow = $(this).closest('.data-row');
        var orderId = orderRow.find('.value:first').text();
        var newStatus = $(this).val();
        var statusSpan = orderRow.find('.status-value');
        console.log(statusSpan);
        updateOrderStatus(orderId, newStatus, orderRow);

    });

    $('.item-status-select').on('change', function() {
        var itemRow = $(this).closest('.data-row');
        var orderDetailId = itemRow.data('order-detail-id');
        var newStatus = $(this).val();
        updateOrderItemStatus(orderDetailId, newStatus, itemRow);
    });


    function updateOrderStatus(orderId, newStatus, orderRow) {
        $.ajax({
            url: '/admin/update_order_status',
            type: 'POST',
            data: {
                order_id: orderId,
                status: newStatus
            },
            success: function(response) {
                console.log(response.message);

                orderRow.find('.value:nth-child(5)').html('<span class="status-value ' + newStatus.toLowerCase() + '">' +newStatus+ '</span>');
                
            },
            error: function(error) {
                console.log(error);
            }
        });
    }

    function updateOrderItemStatus(orderDetailId, newStatus, itemRow) {
        $.ajax({
            url: '/admin/update_order_item_status',
            type: 'POST',
            data: {
                order_detail_id: orderDetailId,
                status: newStatus
            },
            success: function(response) {
                console.log(response.message);
                itemRow.find('.value:nth-child(5)').html('<span class="status-value ' + newStatus.toLowerCase() + '">' +newStatus+ '</span>');
            },
            error: function(error) {
                console.log(error);
            }
        });
    }

    function updateSearchDay(){
        $('#date-range-form').on('submit', function(e) {
            e.preventDefault();
            var startDate = $('#start-date').val();
            var endDate = $('#end-date').val();
    
            $.ajax({
                url: '/admin/orders',
                type: 'GET',
                data: {
                    start_date: startDate,
                    end_date: endDate
                },
                success: function(response) {
                    updateOrdersTable(response.orders);
                },
                error: function(error) {
                    console.error('Error:', error);
                }
            });
        });
    
        function updateOrdersTable(orders) {
            var $ordersTable = $('#orders-table');
            $ordersTable.empty();
    
            orders.forEach(function(order) {
                var orderHtml = createOrderHtml(order);
                $ordersTable.append(orderHtml);
            });
    
            updateEventListeners();
        }
    
        function createOrderHtml(order) {
            var html = `
                <div class="data-row">
                    <div class="value">${order.order_id}</div>
                    <div class="value">${order.table_number}</div>
                    <div class="value">${order.date}</div>
                    <div class="value">${order.total_amount}</div>
                    <div class="value">
                        <span class="status-value ${order.status.toLowerCase()}">${order.status}</span>
                    </div>
                    <div class="value">
                        <select class="order-status-select">
                            <option value="Pending" ${order.status === 'Pending' ? 'selected' : ''}>Pending</option>
                            <option value="Preparing" ${order.status === 'Preparing' ? 'selected' : ''}>Preparing</option>
                            <option value="Completed" ${order.status === 'Completed' ? 'selected' : ''}>Completed</option>
                            <option value="Canceled" ${order.status === 'Canceled' ? 'selected' : ''}>Canceled</option>
                        </select>
                    </div>
                    <div class="value">
                        <button class="button_show_more" data-order-id="${order.order_id}">Show More</button>
                    </div>
                </div>
                <div class="order-details" data-order-id="${order.order_id}" style="display: none;">
                    <div id="title-row">
                        <div class="value">IMG</div>
                        <div class="value">NAME</div>
                        <div class="value">QUANTITY</div>
                        <div class="value">PRICE</div>
                        <div class="value">STATUS</div>
                        <div class="value">CHANGE STATUS</div>
                    </div>
                    ${order.items.map(item => createOrderItemHtml(item)).join('')}
                </div>
            `;
            return html;
        }
    
        function createOrderItemHtml(item) {
            return `
                <div class="data-row" data-order-detail-id="${item.order_detail_id}">
                    <div class="value"><img src="/static/${item.image_url}" alt="${item.product_name}" width="50px" height="50px"></div>
                    <div class="value">${item.product_name}</div>
                    <div class="value">${item.quantity}</div>
                    <div class="value">${item.price}</div>
                    <div class="value"><span class="status-value ${item.status.toLowerCase()}">${item.status}</span></div>
                    <div class="value">
                        <select class="item-status-select">
                            <option value="Pending" ${item.status === 'Pending' ? 'selected' : ''}>Pending</option>
                            <option value="Preparing" ${item.status === 'Preparing' ? 'selected' : ''}>Preparing</option>
                            <option value="Completed" ${item.status === 'Completed' ? 'selected' : ''}>Completed</option>
                            <option value="Canceled" ${item.status === 'Canceled' ? 'selected' : ''}>Canceled</option>
                        </select>
                    </div>
                </div>
            `;
        }
    
        function updateEventListeners() {

            $('button.button_show_more').off('click').on('click', function() {
                var orderId = $(this).data('order-id');
                $('.order-details[data-order-id="' + orderId + '"]').toggle();
            });
    
            $('.order-status-select').off('change').on('change', function() {
                var orderRow = $(this).closest('.data-row');
                var orderId = orderRow.find('.value:first').text();
                var newStatus = $(this).val();
                updateOrderStatus(orderId, newStatus, orderRow);
            });
    
            $('.item-status-select').off('change').on('change', function() {
                var itemRow = $(this).closest('.data-row');
                var orderDetailId = itemRow.data('order-detail-id');
                var newStatus = $(this).val();
                updateOrderItemStatus(orderDetailId, newStatus, itemRow);
            });
        }
    }
    updateSearchDay();
});