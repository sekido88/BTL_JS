$(document).ready(function() {
    ProcessActionCart();
    ShowFoodItems();
});

function ProcessActionCart() {
    var cart = [];
    var totalQuantity = 0;
    var totalPrice = 0;
    SendDataToDataBase();

    function SendDataToDataBase() {
        $('#cart_order').click(function() {
            if (cart.length == 0) {
                alert('Your cart is empty!');
                return;
            }

            const tableNumber = $('#table-number').val();
            if (!tableNumber) {
                alert('Please enter a table number.');
                return;
            }

            getClientId().then(function(clientId) {
                sendOrderToServer(clientId, tableNumber);
            });
        });
    }

    function getClientId() {
        let clientId = localStorage.getItem('client_id');
        if (clientId) {
            return Promise.resolve(clientId);
        }
        return $.ajax({
            url: '/generate_client_id',
            type: 'POST',
            success: function(response) {
                localStorage.setItem('client_id', response.client_id);
                return response.client_id;
            }
        });
    }

    function sendOrderToServer(clientId, tableNumber) {
        $.ajax({
            url: '/place_order',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                client_id: clientId,
                total_amount: totalPrice,
                table_number: tableNumber,
                items: cart.filter(item => item.id && item.quantity && item.price).map(item => ({
                    product_id: item.id,
                    quantity: item.quantity,
                    price: item.price
                }))
            }),
            success: handleOrderSuccess,
            error: handleOrderError
        });
    }

    function handleOrderSuccess(response) {
        if (response.success) {
            alert('Order placed successfully! Order ID: ' + response.order_id);
            clearCart();
            updateCartDisplay();
            $('.background_cart_content').hide();
        } else {
            alert('Error: ' + response.error);
        }
    }

    function handleOrderError(xhr, status, error) {
        alert('An error occurred: ' + error);
    }

    function RenderCart() {
        $('.cart_content').empty();
        cart.forEach(function(item, index) {
            const cartItemHTML = createCartItemHTML(item, index);
            $('.cart_content').append(cartItemHTML);
        });

        $('.cancel_cart_content_product').click(function() {
            const productIndex = $(this).closest('.cart_content_product').data('index');
            RemoveItemFromCart(productIndex);
        });
    }

    function createCartItemHTML(item, index) {
        return `
            <div class="cart_content_product" data-index="${index}">
                <div class="img_cart_content_product">
                    <img src="${item.imageUrl ?? '#'}" alt="${item.name ?? 'Product'}">
                </div>
                <div class="detail_cart_content_product">
                    <div>${item.name ?? 'Product'}</div>
                    <div>${item.quantity ?? 0} x <span class="detail_cart_content_product_price_value">$${(item.price ?? 0).toFixed(2)}</span></div>
                </div>
                <div class="cancel_cart_content_product">X</div>
            </div>
        `;
    }

    function UpdateTotalPrice() {
        totalPrice = cart.reduce((total, item) => total + item.price * item.quantity, 0);
        $('.total_price_value').text('$' + totalPrice.toFixed(2));
        $('.total_price_value').addClass("detail_cart_content_product_price_value");
    }

    function UpdateCartCount() {
        $('.cart-count').text(totalQuantity);
    }

    function RemoveItemFromCart(productIndex) {
        if (productIndex != -1) {
            if (confirm("Bạn có chắc chắn muốn xóa sản phẩm này khỏi giỏ hàng?")) {
                const removedItem = cart[productIndex];
                totalQuantity -= removedItem.quantity; 
                cart.splice(productIndex, 1); 
                updateCartDisplay();
            }
        }
    }

    function updateCartDisplay() {
        RenderCart();
        UpdateTotalPrice();
        UpdateCartCount();
    }

    function clearCart() {
        cart = [];
        totalQuantity = 0;
        totalPrice = 0;
    }

    $('.cart-icon').click(function() {
        $('.background_cart_content').toggle();
    });

    $('.list_product_content').on('click', '.add_to_cart, .product_item', function(event) {
        event.stopPropagation();
        const productItem = $(this).closest('.product_item');
        const product = extractProductInfo(productItem);
        addToCart(product);
        updateCartDisplay();
    });

    function extractProductInfo(productItem) {
        return {
            id: productItem.data('product-id'),
            name: productItem.find('h4').text(),
            price: parseFloat(productItem.find('.price').text().replace('$', '')),
            imageUrl: productItem.find('img').attr('src')
        };
    }

    function addToCart(product) {
        const existingCartItem = cart.find(item => item.id === product.id);
        if (existingCartItem) {
            existingCartItem.quantity++;
        } else {
            cart.push({...product, quantity: 1});
        }
        totalQuantity++;
    }
}

function ShowFoodItems() {
    const $bunchaTitle = $('.title_main_product:first-child');
    const $drinksTitle = $('.title_main_product:last-child');
    const $foodItems = $('.food_item');
    const $drinkItems = $('.drink_item');

    $drinkItems.hide();
    $bunchaTitle.addClass('highlight');

    $bunchaTitle.on('click', toggleItems);
    $drinksTitle.on('click', toggleItems);

    function toggleItems() {
        $foodItems.toggle();
        $drinkItems.toggle();
        $bunchaTitle.toggleClass('highlight');
        $drinksTitle.toggleClass('highlight');
    }
}