module key_debounce(
    input        clk_50m,
    input        rst_n,
    input        left_key,     // 低电平有效按键
    input        right_key,    // 低电平有效按键
    output  reg  left_flag,    // 消抖后输出，低电平触发高脉冲
    output  reg  right_flag
);

// 消抖时间200ms（50MHz时钟下，100_0000个周期）
parameter CNT_MAX = 32'd10_000_000;

// 按键延迟寄存器和计数器
reg        left_key_d0, left_key_d1;   // left_key延迟采样
reg        right_key_d0, right_key_d1; // right_key延迟采样
reg [31:0] cnt;                        // 消抖计数器

// 对两个按键分别进行延迟采样
always @(posedge clk_50m or negedge rst_n) begin
    if (!rst_n) begin
        left_key_d0  <= 1'b1;
        left_key_d1  <= 1'b1;
        right_key_d0 <= 1'b1;
        right_key_d1 <= 1'b1;
    end
    else begin
        // left_key延迟两拍
        left_key_d0 <= left_key;
        left_key_d1 <= left_key_d0;
        
        // right_key延迟两拍
        right_key_d0 <= right_key;
        right_key_d1 <= right_key_d0;
    end
end

// 消抖计数器
always @(posedge clk_50m or negedge rst_n) begin
    if (!rst_n)
        cnt <= 32'd0;
    else begin
        // 检测按键是否变化（包括按下和释放）
        if ((left_key_d0 != left_key_d1) || (right_key_d0 != right_key_d1))
            cnt <= CNT_MAX;   // 检测到变化，重置计数器
        else if (cnt > 0)
            cnt <= cnt - 1;  
        else
            cnt <= 0;        
    end
end

// 输出稳定的left_flag
always @(posedge clk_50m or negedge rst_n) begin
    if (!rst_n)
        left_flag <= 1'b0;
    else if (cnt == 0) begin
        left_flag <= ~left_key_d1;
    end
    else
        left_flag <= 1'b0;  // 消抖期间保持低电平
end

// 输出稳定的right_flag
always @(posedge clk_50m or negedge rst_n) begin
    if (!rst_n)
        right_flag <= 1'b0;
    else if (cnt == 0) begin
        right_flag <= ~right_key_d1;
    end
    else
        right_flag <= 1'b0;  // 消抖期间保持低电平
end

endmodule