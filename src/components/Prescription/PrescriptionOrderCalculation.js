import React, { useEffect } from "react";
import { CalculationGrid, TotalGrid } from "../checkout/CheckOut.style";
import { Grid, Typography, useTheme } from "@mui/material";
import CustomDivider from "../CustomDivider";
import { t } from "i18next";
import {
  cartItemsTotalAmount,
  getCalculatedTotal,
  getDeliveryFees,
  getInfoFromZoneData,
  handleDistance,
} from "../../utils/CustomFunctions";
import { setTotalAmount } from "../../redux/slices/cart";
import { getAmountWithSign } from "../../helper-functions/CardHelpers";
import { useDispatch } from "react-redux";
import useGetVehicleCharge from "../../api-manage/hooks/react-query/order-place/useGetVehicleCharge";

const PrescriptionOrderCalculation = ({
  storeData,
  configData,
  distanceData,
  orderType,
  zoneData,
  origin,
  destination,
  totalOrderAmount,
}) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const tempDistance =
    distanceData?.data?.rows?.[0]?.elements[0]?.distance?.value / 1000;

  const { data: extraCharge, refetch: extraChargeRefetch } =
    useGetVehicleCharge({ tempDistance });
  useEffect(() => {
    extraChargeRefetch();
  }, [distanceData]);
  const getPrescriptionDeliveryFees = (
    storeData,
    configData,
    distance,
    orderType,
    zoneData,
    origin,
    destination
  ) => {
    let convertedDistance = handleDistance(
      distance?.rows?.[0]?.elements,
      origin,
      destination
    );

    let deliveryFee = convertedDistance * configData?.per_km_shipping_charge;
    //checking if latest codes are there at github

    //restaurant self delivery system checking
    if (Number.parseInt(storeData?.self_delivery_system) === 1) {
      if (storeData?.free_delivery) {
        return 0;
      } else {
        deliveryFee =
          convertedDistance * storeData?.per_km_shipping_charge || 0;
        if (
          deliveryFee > storeData?.minimum_shipping_charge &&
          deliveryFee < storeData.maximum_shipping_charge
        ) {
          return deliveryFee;
        } else {
          if (deliveryFee < storeData?.minimum_shipping_charge) {
            return storeData?.minimum_shipping_charge;
          } else if (
            storeData?.maximum_shipping_charge !== null &&
            deliveryFee > storeData?.maximum_shipping_charge
          ) {
            return storeData?.maximum_shipping_charge;
          }
        }
      }
    } else {
      if (zoneData?.data?.zone_data?.length > 0) {
        const chargeInfo = getInfoFromZoneData(zoneData);

        if (chargeInfo?.pivot?.per_km_shipping_charge) {
          deliveryFee =
            convertedDistance *
            (chargeInfo?.pivot?.per_km_shipping_charge || 0);

          if (deliveryFee < chargeInfo?.pivot?.minimum_shipping_charge) {
            return chargeInfo?.pivot?.minimum_shipping_charge + extraCharge;
          } else if (
            deliveryFee > chargeInfo?.pivot?.maximum_shipping_charge &&
            chargeInfo?.pivot?.maximum_shipping_charge !== null
          ) {
            return chargeInfo?.pivot?.maximum_shipping_charge + extraCharge;
          } else {
            if (
              (configData?.free_delivery_over !== null &&
                configData?.free_delivery_over > 0 &&
                totalOrderAmount > configData?.free_delivery_over) ||
              orderType === "take_away"
            ) {
              return 0;
            } else {
              return deliveryFee + extraCharge;
            }
          }
        }
      }
    }
  };
  const handleTotalAmount = () => {
    const totalAmount = getPrescriptionDeliveryFees(
      storeData,
      configData,
      distanceData?.data,
      orderType,
      zoneData,
      origin,
      destination
    );
    localStorage.setItem("totalAmount", totalAmount);
    return (
      <Typography color={theme.palette.primary.main}>
        {storeData && getAmountWithSign(totalAmount)}
      </Typography>
    );
  };
  return (
    <CalculationGrid container item md={12} xs={12} spacing={1}>
      <Grid item md={8} xs={8}>
        {t("Delivery fee")}
      </Grid>
      <Grid item md={4} xs={4} align="right">
        {storeData &&
          getAmountWithSign(
            getPrescriptionDeliveryFees(
              storeData,
              configData,
              distanceData?.data,
              orderType,
              zoneData,
              origin,
              destination
            )
          )}
      </Grid>
      <CustomDivider />
      <TotalGrid container md={12} xs={12} mt="1rem">
        <Grid item md={8} xs={8} pl=".5rem">
          <Typography fontWeight="bold" color={theme.palette.primary.main}>
            {t("Total")}
          </Typography>
        </Grid>
        <Grid item md={4} xs={4} align="right">
          {handleTotalAmount()}
        </Grid>
      </TotalGrid>
    </CalculationGrid>
  );
};

export default PrescriptionOrderCalculation;
