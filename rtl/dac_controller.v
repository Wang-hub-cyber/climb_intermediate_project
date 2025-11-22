module dac_controller(
    input         clk,          // 系统时钟 (50MHz)
    input         rst_n,        // 复位信号
    input         dac_en,       // DAC使能信号
    input  [7:0]  dac_data_in,  // 来自SDRAM的8位数据
    output [7:0]  dac_data_out, // 输出到DAC的数据
    output        dac_clk       // DAC采样时钟 (根据DAC型号配置)
);

// DAC时钟分频 (示例：12.5MHz)
reg [1:0] clk_div_cnt;
always @(posedge clk or negedge rst_n) begin
    if (!rst_n) clk_div_cnt <= 2'd0;
    else clk_div_cnt <= clk_div_cnt + 1'b1;
end
assign dac_clk = clk_div_cnt[1]; // 50MHz/4=12.5MHz

// 数据输出寄存器
reg [7:0] dac_reg;
always @(posedge dac_clk or negedge rst_n) begin
    if (!rst_n) dac_reg <= 8'h00;
    else if (dac_en) dac_reg <= dac_data_in;
    else dac_reg <= 8'h00; // 数据发送完成后输出0
end

assign dac_data_out = dac_reg;

endmodule