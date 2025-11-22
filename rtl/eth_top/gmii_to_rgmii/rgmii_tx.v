module rgmii_tx(
    //GMII发送端口
    input              gmii_tx_clk ,   //GMII发送时钟 
    input              gmii_tx_en  ,   //GMII输出数据有效信号
    input       [7:0]  gmii_txd    ,   //GMII输出数据        
    
    //RGMII发送端口
    output             rgmii_txc   ,   //RGMII发送数据时钟    
    output             rgmii_tx_ctl,   //RGMII输出数据有效信号
    output      [3:0]  rgmii_txd       //RGMII输出数据     
    );

//*****************************************************
//**                    main code
//*****************************************************

ddo_x4 ddo_x4_inst(
    .datain_h(gmii_txd[3:0]),
    .datain_l(gmii_txd[7:4]),
    .outclock(gmii_tx_clk),
    .dataout(rgmii_txd)
);

ddo_x1 ddo_x1_inst(
    .datain_h(gmii_tx_en),
    .datain_l(gmii_tx_en ), 
    .outclock(gmii_tx_clk),
    .dataout(rgmii_tx_ctl)
);

ddo_x1 ddo_x1_clk(
    .datain_h(1'b1),
    .datain_l(1'b0),
    .outclock(gmii_tx_clk), 
    .dataout(rgmii_txc)
);

endmodule