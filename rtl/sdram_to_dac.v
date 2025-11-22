module sdram_to_dac(
    input         clk,          // 系统时钟 50MHZ
    input         rst_n,        // 复位信号
    input   [7:0] sdram_data,   // 来自SDRAM的8位数据
    output reg [7:0]  dac_data,     // 输出到DAC控制器的8位数据
    output  reg    data_req      // 向SDRAM请求数据
);
reg cnt;
always @(posedge clk or negedge rst_n)begin
    if(!rst_n) begin
        dac_data <= 0;
        data_req <= 0;
    end
    else begin 
        cnt <= cnt + 1'b1;
        if(cnt == 1'b0)begin
        data_req <= 1'b1;
        end
        else begin
        dac_data <= sdram_data;
        end
    end
end

endmodule