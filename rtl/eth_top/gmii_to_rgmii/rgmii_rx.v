module rgmii_rx(
    //以太网RGMII接口
    input              rgmii_rxc   , //RGMII接收时钟
    input              rgmii_rx_ctl, //RGMII接收数据控制信号
    input       [3:0]  rgmii_rxd   , //RGMII接收数据    

    //以太网GMII接口
    output             gmii_rx_clk , //GMII接收时钟
    output             gmii_rx_dv  , //GMII接收数据有效信号
    output      [7:0]  gmii_rxd      //GMII接收数据   
    );   

//wire define    
wire  [1:0]  gmii_rxdv_t;        //两位GMII接收有效信号 

//*****************************************************
//**                    main code
//*****************************************************

assign gmii_rx_clk = rgmii_rxc;
assign gmii_rx_dv = gmii_rxdv_t[0] & gmii_rxdv_t[1];

ddi_x4 ddi_x4_inst(
    .datain     (rgmii_rxd    ),
    .inclock    (rgmii_rxc    ),
    .dataout_h  (gmii_rxd[7:4]),
    .dataout_l  (gmii_rxd[3:0])
);

ddi_x1 ddi_x1_inst(
    .datain     (rgmii_rx_ctl),
    .inclock    (rgmii_rxc  ),
    .dataout_h  (gmii_rxdv_t[1]),
    .dataout_l  (gmii_rxdv_t[0])
);

endmodule