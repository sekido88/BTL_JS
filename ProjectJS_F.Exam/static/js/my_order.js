$(document).ready(function() {
  const clientId = localStorage.getItem('client_id');
  if (clientId) {
    fetchOrders(clientId);
  } else {
    $('#order-details').hide();
    $('#no-orders').show();
  }

  $(document).on('click', '.button_show_more', function() {
    const orderId = $(this).data('order-id');
    const orderDetails = $(`.order-details[data-order-id="${orderId}"]`);
    orderDetails.toggle();
  });

  // Refresh orders periodically to get the latest status updates
  // setInterval(function() {
  //   if (clientId) {
  //     fetchOrders(clientId);
  //   }
  // }, 5000); // Refresh every 5 seconds
});

function fetchOrders(clientId) {
  $.ajax({
    url: '/my_order',
    type: 'POST',
    data: { client_id: clientId },
    success: function(response) {
      console.log(response);
      displayOrders(response);
    },
    error: function(xhr, status, error) {
      console.error('Error:', error);
    }
  });
}

function displayOrders(orders) {
  if (orders.length > 0) {
    $('#order-details').empty();
    orders.forEach(function(order) {
      const orderHTML = `
        <div class="data-row">
          <div class="value">${order.order_id}</div>
          <div class="value">${order.table_number}</div>
          <div class="value">${new Date(order.date).toLocaleString()}</div>
          <div class="value">${order.total_amount}</div>
          <div class="value">
            <span class="status-value ${order.status}">${order.status}</span>
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
          </div>
          ${order.items.map(item => `
            <div class="data-row" data-order-detail-id="${item.order_detail_id}">
              <div class="value"><img src="static/${item.image_url}" alt="${item.product_name}" width="50px" height="50px"></div>
              <div class="value">${item.product_name}</div>
              <div class="value">${item.quantity}</div>
              <div class="value">${item.price}</div>
              <div class="value"><span class="status-value ${item.status}">${item.status}</span></div>
            </div>
          `).join('')}
        </div>
      `;
      $('#order-details').append(orderHTML);
    });
    $('#no-orders').hide();
  } else {
    $('#order-details').hide();
    $('#no-orders').show();
  }
}