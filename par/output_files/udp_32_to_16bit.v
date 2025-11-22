module udp_32_to_16bit(
    input               clk,
    input               rst_n,
    input               rec_en,       // UDP接收使能
    input       [31:0]  rec_data,     // 32位输入数据
    output reg  [15:0]   dac_data,     // 16位输出数据
    output reg          data_valid    // 数据有效信号
);

reg  byte_sel;

always @(posedge clk or negedge rst_n) begin
    if (!rst_n) begin
        byte_sel <= 1'd0;
        dac_data <= 16'd0;
        data_valid <= 1'b0;
    end 
    else if (rec_en) begin
        case(byte_sel)
            1'd0: dac_data <= rec_data[31:16];
            1'd1: dac_data <= rec_data[15:0];
        endcase
        data_valid <= 1'b1;
        byte_sel <= byte_sel + 1'b1;
    end 
    else begin
        data_valid <= 1'b0;
    end
end

endmodule