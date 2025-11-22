module udp_32_to_8bit(
    input               clk,
    input               rst_n,
    input               rec_en,       // UDP接收使能
    input       [31:0]  rec_data,     // 32位输入数据
    output reg  [7:0]   dac_data,     // 8位输出数据
    output reg          data_valid    // 数据有效信号
);

reg [1:0] byte_sel;



always @(posedge clk or negedge rst_n) begin
    if (!rst_n) begin
        byte_sel <= 2'd0;
        dac_data <= 8'd0;
        data_valid <= 1'b0;
    end else if (rec_en) begin
        case(byte_sel)
            2'd0: dac_data <= rec_data[31:24];
            2'd1: dac_data <= rec_data[23:16];
            2'd2: dac_data <= rec_data[15:8];
            2'd3: dac_data <= rec_data[7:0];
        endcase
        data_valid <= 1'b1;
        byte_sel <= byte_sel + 1'b1;
    end else begin
        data_valid <= 1'b0;
    end
end

endmodule